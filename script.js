// Estado global da aplicação
class CoxinhasDelivery {
    constructor() {
        this.cart = [];
        this.currentCategory = 'all';
        this.whatsappNumber = '5598985197515';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCartDisplay();
        this.filterProducts('all');
    }

    // Event Listeners
    bindEvents() {
        // Botão do carrinho
        document.getElementById('cartBtn').addEventListener('click', () => {
            this.toggleCart();
        });

        // Fechar carrinho
        document.getElementById('closeCart').addEventListener('click', () => {
            this.closeCart();
        });

        // Overlay do carrinho
        document.getElementById('cartOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'cartOverlay') {
                this.closeCart();
            }
        });

        // Botões de categoria
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterProducts(category);
                this.updateCategoryButtons(e.target);
            });
        });

        // Botões de adicionar produto
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productData = JSON.parse(e.target.dataset.product);
                this.addToCart(productData);
                this.showAddedFeedback(e.target);
            });
        });

        // Botão de finalizar pedido
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.checkout();
        });

        // Tecla ESC para fechar carrinho
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });

        // Event listeners para o formulário
        this.setupFormEvents();
    }

    // Configurar eventos do formulário
    setupFormEvents() {
        // Radio buttons para troco
        const changeRadios = document.querySelectorAll('input[name="needChange"]');
        const changeAmountInput = document.getElementById('changeAmount');
        
        changeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'yes') {
                    changeAmountInput.style.display = 'block';
                    changeAmountInput.required = true;
                } else {
                    changeAmountInput.style.display = 'none';
                    changeAmountInput.required = false;
                    changeAmountInput.value = '';
                }
            });
        });

        // Validação em tempo real
        const requiredFields = ['customerName', 'customerAddress'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('input', () => {
                this.validateForm();
            });
        });
    }

    // Gerenciamento do Carrinho
    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.updateCartDisplay();
        this.saveCartToStorage();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCartDisplay();
        this.saveCartToStorage();
    }

    updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            this.updateCartDisplay();
            this.saveCartToStorage();
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    // Interface do Carrinho
    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartItems();
        this.updateCartTotal();
        this.updateCheckoutButton();
        this.updateFormVisibility();
    }

    // Mostrar/ocultar formulário baseado nos itens do carrinho
    updateFormVisibility() {
        const customerForm = document.getElementById('customerForm');
        const hasItems = this.cart.length > 0;
        
        if (hasItems) {
            customerForm.style.display = 'block';
        } else {
            customerForm.style.display = 'none';
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        const count = this.getCartItemCount();
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }

    updateCartItems() {
        const cartItems = document.getElementById('cartItems');
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <p>Seu carrinho está vazio</p>
                    <p>Adicione alguns produtos deliciosos!</p>
                </div>
            `;
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="app.updateQuantity(${item.id}, ${item.quantity - 1})">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="app.updateQuantity(${item.id}, ${item.quantity + 1})">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateCartTotal() {
        const cartTotal = document.getElementById('cartTotal');
        const total = this.getCartTotal();
        cartTotal.textContent = total.toFixed(2).replace('.', ',');
    }

    updateCheckoutButton() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const hasItems = this.cart.length > 0;
        
        checkoutBtn.disabled = !hasItems;
        checkoutBtn.style.opacity = hasItems ? '1' : '0.6';
    }

    // Controle do Carrinho
    toggleCart() {
        const cartOverlay = document.getElementById('cartOverlay');
        cartOverlay.classList.toggle('active');
        
        if (cartOverlay.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeCart() {
        const cartOverlay = document.getElementById('cartOverlay');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Filtros de Categoria
    filterProducts(category) {
        this.currentCategory = category;
        const products = document.querySelectorAll('.product-card');
        
        products.forEach(product => {
            const productCategory = product.dataset.category;
            const shouldShow = category === 'all' || productCategory === category;
            
            if (shouldShow) {
                product.style.display = 'block';
                product.classList.add('fade-in');
            } else {
                product.style.display = 'none';
                product.classList.remove('fade-in');
            }
        });
    }

    updateCategoryButtons(activeBtn) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    // Feedback Visual
    showAddedFeedback(button) {
        const originalText = button.innerHTML;
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Adicionado!
        `;
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 1500);
    }

    // Validação do formulário
    validateForm() {
        const customerName = document.getElementById('customerName').value.trim();
        const customerAddress = document.getElementById('customerAddress').value.trim();
        const needChangeRadio = document.querySelector('input[name="needChange"]:checked');
        const changeAmount = document.getElementById('changeAmount').value;
        
        let isValid = true;
        
        // Validar campos obrigatórios
        if (!customerName) isValid = false;
        if (!customerAddress) isValid = false;
        
        // Validar troco se necessário
        if (needChangeRadio && needChangeRadio.value === 'yes') {
            if (!changeAmount || parseFloat(changeAmount) <= this.getCartTotal()) {
                isValid = false;
            }
        }
        
        // Atualizar botão de checkout
        const checkoutBtn = document.getElementById('checkoutBtn');
        checkoutBtn.disabled = !isValid || this.cart.length === 0;
        checkoutBtn.style.opacity = (isValid && this.cart.length > 0) ? '1' : '0.6';
        
        return isValid;
    }

    // Integração WhatsApp
    checkout() {
        if (this.cart.length === 0) return;
        
        // Validar formulário antes de enviar
        if (!this.validateForm()) {
            alert('Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

        const message = this.generateWhatsAppMessage();
        const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Limpar carrinho e formulário após envio
        this.clearCart();
        this.clearForm();
        this.closeCart();
        
        // Mostrar confirmação
        this.showOrderConfirmation();
    }

    generateWhatsAppMessage() {
        const items = this.cart.map(item => 
            `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
        ).join('\n');
        
        const total = this.getCartTotal();
        const currentDate = new Date().toLocaleString('pt-BR');
        
        // Dados do formulário
        const customerName = document.getElementById('customerName').value.trim();
        const customerAddress = document.getElementById('customerAddress').value.trim();
        const needChangeRadio = document.querySelector('input[name="needChange"]:checked');
        const changeAmount = document.getElementById('changeAmount').value;
        const observations = document.getElementById('observations').value.trim();
        
        let message = `🍗 *PEDIDO - COXINHAS DELIVERY*

📅 Data: ${currentDate}

👤 *CLIENTE:*
Nome: ${customerName}
📍 Endereço: ${customerAddress}

📋 *ITENS:*
${items}

💰 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`;

        // Adicionar informações de troco
        if (needChangeRadio) {
            if (needChangeRadio.value === 'yes' && changeAmount) {
                const change = parseFloat(changeAmount) - total;
                message += `\n\n💵 *PAGAMENTO:*\nPrecisa de troco para: R$ ${parseFloat(changeAmount).toFixed(2).replace('.', ',')}\nTroco: R$ ${change.toFixed(2).replace('.', ',')}`;
            } else if (needChangeRadio.value === 'no') {
                message += `\n\n💵 *PAGAMENTO:*\nNão precisa de troco`;
            }
        }

        // Adicionar observações se houver
        if (observations) {
            message += `\n\n📝 *OBSERVAÇÕES:*\n${observations}`;
        }

        return message;
    }

    // Limpar formulário
    clearForm() {
        document.getElementById('customerName').value = '';
        document.getElementById('customerAddress').value = '';
        document.getElementById('observations').value = '';
        document.getElementById('changeAmount').value = '';
        
        // Resetar radio buttons
        const radioButtons = document.querySelectorAll('input[name="needChange"]');
        radioButtons.forEach(radio => radio.checked = false);
        
        // Ocultar campo de troco
        const changeAmountGroup = document.getElementById('changeAmountGroup');
        if (changeAmountGroup) {
            changeAmountGroup.style.display = 'none';
        }
    }

    clearCart() {
        this.cart = [];
        this.updateCartDisplay();
        this.saveCartToStorage();
    }

    showOrderConfirmation() {
        // Criar elemento de confirmação
        const confirmation = document.createElement('div');
        confirmation.className = 'order-confirmation';
        confirmation.innerHTML = `
            <div class="confirmation-content">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3>Pedido Enviado!</h3>
                <p>Seu pedido foi enviado para o WhatsApp. Aguarde o contato para confirmação!</p>
            </div>
        `;
        
        // Adicionar estilos
        confirmation.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            animation: fadeIn 0.3s ease;
        `;
        
        confirmation.querySelector('.confirmation-content').style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            max-width: 300px;
            margin: 1rem;
        `;
        
        confirmation.querySelector('svg').style.cssText = `
            width: 48px;
            height: 48px;
            color: #28a745;
            margin-bottom: 1rem;
        `;
        
        confirmation.querySelector('h3').style.cssText = `
            margin-bottom: 0.5rem;
            color: #28a745;
        `;
        
        document.body.appendChild(confirmation);
        
        // Remover após 3 segundos
        setTimeout(() => {
            confirmation.remove();
        }, 3000);
    }

    // Persistência de Dados
    saveCartToStorage() {
        localStorage.setItem('coxinhas-cart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('coxinhas-cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCartDisplay();
        }
    }

    // Utilitários
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const sectionTop = section.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        }
    }

    // Inicialização após carregamento da página
    onPageLoad() {
        this.loadCartFromStorage();
        
        // Adicionar classe de carregamento concluído
        document.body.classList.add('loaded');
        
        // Lazy loading para imagens
        this.setupLazyLoading();
        
        // Configurar scroll suave
        this.setupSmoothScroll();
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.src || img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    }

    setupSmoothScroll() {
        // Scroll suave para links internos
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
            });
        });
    }
}

// Função global para scroll suave
function scrollToSection(sectionId) {
    if (window.app) {
        window.app.scrollToSection(sectionId);
    }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CoxinhasDelivery();
    window.app.onPageLoad();
});

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Prevenção de zoom em inputs (mobile)
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
});

// Otimização de performance
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Recalcular layouts se necessário
        if (window.app) {
            window.app.updateCartDisplay();
        }
    }, 250);
});

// Tratamento de erros globais
window.addEventListener('error', (e) => {
    console.error('Erro na aplicação:', e.error);
    // Aqui você pode implementar um sistema de logging
});

// Exportar para uso global
window.CoxinhasDelivery = CoxinhasDelivery;