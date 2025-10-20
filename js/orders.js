// order.js // Order Management 
class OrderManager {
    constructor() {
        this.orders = [];
        this.customers = [];
        this.stocks = [];
        this.dataTable = null;
        this.showingInactive = false;
        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.setupEventListeners();
        this.setupModalEvents();
    }

    async loadInitialData() {
        try {
            this.showLoading();
            console.log('🔄 Başlangıç verileri yükleniyor...');
            
            await Promise.all([
                this.loadCustomers(),
                this.loadStocks()
            ]);
            
            // Başlangıçta sadece aktif siparişleri yükle (isActive=true olanlar)
            await this.loadActiveOrders();
            
            this.hideLoading();
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            this.showError('Veriler yüklenirken hata oluştu: ' + error.message);
        }
    }

    async loadActiveOrders() {
        try {
            console.log('🔄 AKTİF siparişler yükleniyor (isActive=true)...');
            
            // ÖNCE showingInactive değişkenini false yap
            this.showingInactive = false;
            console.log('🔧 showingInactive değişkeni false yapıldı');
            
            this.orders = await ApiService.getOrders();
            console.log('✅ Aktif siparişler yüklendi:', this.orders.length);
            
            // Gelen siparişleri kontrol et
            this.orders.forEach(order => {
                console.log(`📊 GÖSTERİLEN: ${order.orderNo} - isActive:`, order.isActive);
            });
            
            this.renderOrders();
        } catch (error) {
            console.error('Siparişler yüklenirken hata:', error);
            throw error;
        }
    }

    async loadInactiveOrders() {
        try {
            console.log('🔄 İNAKTİF siparişler yükleniyor (isActive=false)...');
            
            // ÖNCE showingInactive değişkenini true yap
            this.showingInactive = true;
            console.log('🔧 showingInactive değişkeni true yapıldı');
            
            this.orders = await ApiService.getInactiveOrders();
            console.log('📋 OrderManager - Silinmiş siparişler yüklendi:', this.orders.length);
            
            if (this.orders.length === 0) {
                console.log('⚠️  DİKKAT: InactiveOrders boş döndü! API yanıtını kontrol edin.');
            } else {
                this.orders.forEach(order => {
                    console.log(`📊 OrderManager - GÖSTERİLEN (İNAKTİF): ${order.orderNo} - isActive:`, order.isActive);
                });
            }
            
            this.renderOrders();
        } catch (error) {
            console.error('Inactive siparişler yüklenirken hata:', error);
            this.showError('Silinmiş siparişler yüklenirken hata oluştu! ' + error.message);
            throw error;
        }
    }

    async loadCustomers() {
        try {
            this.customers = await ApiService.getCustomers();
            console.log('👥 Müşteriler yüklendi:', this.customers.length);
            this.renderCustomerSelect();
        } catch (error) {
            console.error('Müşteriler yüklenirken hata:', error);
            throw error;
        }
    }

    async loadStocks() {
        try {
            this.stocks = await ApiService.getStocks();
            console.log('📦 Stoklar yüklendi:', this.stocks.length);
            this.renderProductSelect();
        } catch (error) {
            console.error('Stoklar yüklenirken hata:', error);
            throw error;
        }
    }

    findCustomer(customerId) {
        if (!customerId) return null;
        return this.customers.find(c => c.customerId == customerId);
    }

    renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) {
            console.error('Tbody bulunamadı!');
            return;
        }

        // Önce DataTable'ı temizle
        if (this.dataTable) {
            console.log('🗑️  DataTable yok ediliyor...');
            this.dataTable.destroy();
            this.dataTable = null;
        }

        tbody.innerHTML = '';

        console.log(`📊 Tabloya ${this.orders.length} sipariş render ediliyor...`);
        console.log('📊 Orders array:', this.orders);

        if (this.orders.length === 0) {
            const message = this.showingInactive ? 
                'Silinmiş sipariş bulunmamaktadır.' : 
                'Henüz aktif sipariş bulunmamaktadır.';
                
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="fas fa-${this.showingInactive ? 'archive' : 'inbox'} fa-2x text-muted mb-3"></i>
                        <p class="text-muted">${message}</p>
                    </td>
                </tr>
            `;
            
            // Boş tablo için DataTable'ı yeniden başlat
            this.initializeDataTable();
            return;
        }

        // Siparişleri render et
        let rowsHtml = '';
        this.orders.forEach(order => {
            const row = this.createOrderRow(order);
            rowsHtml += row;
        });
        tbody.innerHTML = rowsHtml;

        // DataTable'ı yeniden başlat
        setTimeout(() => {
            this.initializeDataTable();
        }, 100);
    }

    createOrderRow(order) {
        const customer = this.findCustomer(order.customerId);
        const customerName = customer ? customer.customerName : `Müşteri ID: ${order.customerId}`;
        
        console.log(`🎯 Row: ${order.orderNo} - isActive: ${order.isActive}, showingInactive: ${this.showingInactive}`);
        
        // Basit kontrol - showingInactive değerine göre render et
        if (this.showingInactive) {
            // Silinmiş siparişler için row
            return `
                <tr class="table-secondary">
                    <td>
                        <strong>${order.orderNo || 'N/A'}</strong>
                        <br><small class="text-muted">(Silinmiş)</small>
                    </td>
                    <td>${customerName}</td>
                    <td>${this.formatDate(order.orderDate)}</td>
                    <td>${this.formatCurrency(order.totalPrice)}</td>
                    <td>%${order.tax ? (order.tax * 100).toFixed(0) : '0'}</td>
                    <td>
                        <span class="badge bg-danger">Silinmiş</span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="orderManager.viewOrder(${order.orderId})" 
                                    title="Sipariş Detayları">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="orderManager.restoreOrder(${order.orderId})" 
                                    title="Siparişi Geri Yükle">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            // Aktif siparişler için row
            return `
                <tr>
                    <td>
                        <strong>${order.orderNo || 'N/A'}</strong>
                    </td>
                    <td>${customerName}</td>
                    <td>${this.formatDate(order.orderDate)}</td>
                    <td>${this.formatCurrency(order.totalPrice)}</td>
                    <td>%${order.tax ? (order.tax * 100).toFixed(0) : '0'}</td>
                    <td>
                        <span class="badge bg-success">Aktif</span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="orderManager.viewOrder(${order.orderId})" 
                                    title="Sipariş Detayları">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="orderManager.deleteOrder(${order.orderId})" 
                                    title="Siparişi Sil">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    initializeDataTable() {
        // Eski DataTable'ı temizle
        if (this.dataTable) {
            try {
                this.dataTable.destroy();
                console.log('✅ Eski DataTable temizlendi');
            } catch (e) {
                console.log('ℹ️  DataTable zaten temiz');
            }
            this.dataTable = null;
        }

        // Tabloyu temizle ve yeniden oluştur
        const table = $('#ordersTable');
        table.css('width', '100%');

        try {
            this.dataTable = table.DataTable({
                destroy: true, // Önceki instance'ı temizle
                retrieve: true,
                language: {
                    "decimal": "",
                    "emptyTable": "Tabloda veri bulunmamaktadır",
                    "info": "_TOTAL_ kayıttan _START_ - _END_ arası gösteriliyor",
                    "infoEmpty": "0 kayıttan 0 - 0 arası gösteriliyor",
                    "infoFiltered": "(_MAX_ toplam kayıttan filtrelendi)",
                    "lengthMenu": "_MENU_ kayıt göster",
                    "loadingRecords": "Yükleniyor...",
                    "processing": "İşleniyor...",
                    "search": "Ara:",
                    "zeroRecords": "Eşleşen kayıt bulunamadı",
                    "paginate": {
                        "first": "İlk",
                        "last": "Son",
                        "next": "Sonraki",
                        "previous": "Önceki"
                    }
                },
                pageLength: 10,
                responsive: true,
                autoWidth: false
            });
            
            console.log('✅ DataTable başarıyla oluşturuldu');
        } catch (error) {
            console.error('❌ DataTable oluşturulurken hata:', error);
        }
    }

    async toggleOrderList() {
        const toggleBtn = document.getElementById('toggleOrdersBtn');
        
        // Butonu disable et
        toggleBtn.disabled = true;
        const originalHtml = toggleBtn.innerHTML;
        toggleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Yükleniyor...';
        
        try {
            console.log('🔘 toggleOrderList tetiklendi, mevcut durum:', this.showingInactive);
            
            if (this.showingInactive) {
                console.log('🔄 Aktif siparişlere geçiliyor...');
                await this.loadActiveOrders();
                toggleBtn.innerHTML = '<i class="fas fa-archive me-1"></i> Silinmiş Siparişleri Göster';
                toggleBtn.classList.remove('btn-warning');
                toggleBtn.classList.add('btn-secondary');
                document.getElementById('ordersTitle').innerHTML = '<i class="fas fa-shopping-cart me-2"></i>Aktif Siparişler';
                this.showingInactive = false;
            } else {
                console.log('🔄 İnaktif siparişlere geçiliyor...');
                await this.loadInactiveOrders();
                toggleBtn.innerHTML = '<i class="fas fa-list me-1"></i> Aktif Siparişleri Göster';
                toggleBtn.classList.remove('btn-secondary');
                toggleBtn.classList.add('btn-warning');
                document.getElementById('ordersTitle').innerHTML = '<i class="fas fa-archive me-2"></i>Silinmiş Siparişler';
                this.showingInactive = true;
            }
            
            console.log('🔘 Yeni durum:', this.showingInactive);
        } catch (error) {
            console.error('Toggle işleminde hata:', error);
            this.showError('Liste değiştirilirken hata oluştu!');
        } finally {
            // Butonu tekrar enable et
            toggleBtn.disabled = false;
        }
    }

    async deleteOrder(orderId) {
        if (!confirm('Bu siparişi silmek istediğinizden emin misiniz? Sipariş pasif hale getirilecektir.')) return;

        try {
            await ApiService.deleteOrder(orderId);
            await this.loadActiveOrders();
            this.showSuccess('Sipariş başarıyla silindi!');
        } catch (error) {
            console.error('Sipariş silme hatası:', error);
            this.showError('Sipariş silinirken hata oluştu!');
        }
    }

    async restoreOrder(orderId) {
        if (!confirm('Bu siparişi geri yüklemek istediğinizden emin misiniz? Sipariş aktif hale getirilecektir.')) return;

        try {
            console.log('🔄 Sipariş geri yükleniyor:', orderId);
            
            await ApiService.restoreOrder(orderId);
            
            console.log('✅ Sipariş geri yüklendi, liste yenileniyor...');
            await this.loadInactiveOrders();
            
            this.showSuccess('Sipariş başarıyla geri yüklendi!');
            
        } catch (error) {
            console.error('❌ Sipariş geri yüklenirken hata:', error);
            
            let errorMessage = 'Sipariş geri yüklenirken hata oluştu!';
            if (error.message.includes('404')) {
                errorMessage = 'Sipariş bulunamadı!';
            } else if (error.message.includes('500')) {
                errorMessage = 'Sunucu hatası! Lütfen daha sonra tekrar deneyin.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Ağ hatası! API bağlantısı kurulamadı.';
            }
            
            this.showError(errorMessage);
        }
    }

    renderCustomerSelect() {
        const select = document.getElementById('customerSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Müşteri seçin...</option>';
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.customerId;
            option.textContent = customer.customerName;
            select.appendChild(option);
        });
    }

    renderProductSelect() {
        const selects = document.querySelectorAll('.product-select');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Ürün seçin...</option>';
            this.stocks.forEach(stock => {
                const option = document.createElement('option');
                option.value = stock.stockId;
                option.textContent = `${stock.stockName} - ${this.formatCurrency(stock.price)}`;
                option.dataset.price = stock.price;
                select.appendChild(option);
            });
        });
    }

    setupEventListeners() {
        const addItemBtn = document.getElementById('addItem');
        if (addItemBtn) addItemBtn.addEventListener('click', () => this.addOrderItem());

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('product-select')) this.updateItemPrice(e.target);
        });

        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('quantity')) this.calculateTotal();
        });

        const taxRateInput = document.getElementById('taxRate');
        if (taxRateInput) taxRateInput.addEventListener('input', () => this.calculateTotal());

        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item')) {
                e.target.closest('.order-item').remove();
                this.calculateTotal();
            }
        });
    }

    setupModalEvents() {
        const modal = document.getElementById('addOrderModal');
        if (modal) {
            modal.addEventListener('show.bs.modal', () => this.resetOrderForm());
            modal.addEventListener('hidden.bs.modal', () => this.resetOrderForm());
        }
    }

    addOrderItem() {
        const itemsContainer = document.getElementById('orderItems');
        const newItem = document.createElement('div');
        newItem.className = 'order-item row g-2 mb-2';
        newItem.innerHTML = `
            <div class="col-md-5">
                <select class="form-select product-select" required>
                    <option value="">Ürün seçin...</option>
                </select>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control quantity" placeholder="Miktar" min="1" value="1" required>
            </div>
            <div class="col-md-3">
                <input type="text" class="form-control price" placeholder="Birim Fiyat" readonly>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm remove-item">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        itemsContainer.appendChild(newItem);
        this.renderProductSelect();
    }

    updateItemPrice(select) {
        const price = select.selectedOptions[0]?.dataset.price || '0';
        const priceInput = select.closest('.order-item').querySelector('.price');
        priceInput.value = this.formatCurrency(price);
        this.calculateTotal();
    }

    calculateTotal() {
        let subtotal = 0;
        const items = document.querySelectorAll('.order-item');
        items.forEach(item => {
            const quantity = parseFloat(item.querySelector('.quantity').value) || 0;
            const price = parseFloat(item.querySelector('.product-select').selectedOptions[0]?.dataset.price) || 0;
            subtotal += quantity * price;
        });

        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const total = subtotal + subtotal * (taxRate / 100);

        const totalAmountInput = document.getElementById('totalAmount');
        if (totalAmountInput) totalAmountInput.value = total.toFixed(2);
    }

    resetOrderForm() {
        const form = document.getElementById('orderForm');
        if (form) form.reset();

        const orderItems = document.getElementById('orderItems');
        if (orderItems) orderItems.innerHTML = `
            <div class="order-item row g-2 mb-2">
                <div class="col-md-5">
                    <select class="form-select product-select" required>
                        <option value="">Ürün seçin...</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <input type="number" class="form-control quantity" placeholder="Miktar" min="1" value="1" required>
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control price" placeholder="Birim Fiyat" readonly>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger btn-sm remove-item" disabled>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('totalAmount').value = '0.00';
        document.getElementById('taxRate').value = '18';
        this.renderProductSelect();
    }

    async createOrder() {
        const form = document.getElementById('orderForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const createBtn = document.getElementById('createOrderBtn');
        const originalText = createBtn.innerHTML;
        
        try {
            createBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Oluşturuluyor...';
            createBtn.disabled = true;

            const totalAmountValue = document.getElementById('totalAmount').value;

            const orderData = {
                customerId: parseInt(document.getElementById('customerSelect').value),
                orderNo: document.getElementById('orderNo').value.trim(),
                tax: parseFloat(document.getElementById('taxRate').value) / 100,
                totalPrice: parseFloat(totalAmountValue),
                deliveryAddressId: parseInt(document.getElementById('customerSelect').value),
                invoiceAddressId: parseInt(document.getElementById('customerSelect').value),
                orderDetails: []
            };

            const items = document.querySelectorAll('.order-item');
            items.forEach(item => {
                const stockId = parseInt(item.querySelector('.product-select').value);
                const amount = parseInt(item.querySelector('.quantity').value);
                
                if (stockId && amount) {
                    orderData.orderDetails.push({ stockId, amount });
                }
            });

            if (orderData.orderDetails.length === 0) throw new Error('En az bir sipariş kalemi eklemelisiniz!');

            await ApiService.createOrder(orderData);
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
            if (modal) modal.hide();
            
            await this.loadActiveOrders();
            this.showSuccess('Sipariş başarıyla oluşturuldu!');
            
        } catch (error) {
            console.error('Sipariş oluşturma hatası:', error);
            this.showError('Sipariş oluşturulurken hata oluştu! Hata: ' + error.message);
        } finally {
            createBtn.innerHTML = originalText;
            createBtn.disabled = false;
        }
    }

    async viewOrder(orderId) {
        try {
            const order = await ApiService.getOrderById(orderId);
            this.showOrderDetails(order);
        } catch (error) {
            console.error('Sipariş detayları yüklenirken hata:', error);
            this.showError('Sipariş detayları yüklenirken hata oluştu!');
        }
    }

    showOrderDetails(order) {
        const customer = this.findCustomer(order.customerId);
        const customerName = customer ? customer.customerName : 'Bilinmeyen Müşteri';

        // GERÇEK isActive değerini kontrol et
        const isActuallyActive = order.isActive === true || order.isActive === 'true' || order.isActive === 1 || order.isActive === '1';
        const isActuallyInactive = order.isActive === false || order.isActive === 'false' || order.isActive === 0 || order.isActive === '0';

        const statusBadge = isActuallyInactive ? 
            '<span class="badge bg-danger">Silinmiş</span>' : 
            '<span class="badge bg-success">Aktif</span>';

        const content = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Sipariş No:</strong> ${order.orderNo}</p>
                    <p><strong>Müşteri:</strong> ${customerName}</p>
                    <p><strong>Tarih:</strong> ${this.formatDate(order.orderDate)}</p>
                    <p><strong>Durum:</strong> ${statusBadge}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Toplam Tutar:</strong> ${this.formatCurrency(order.totalPrice)}</p>
                    <p><strong>KDV Oranı:</strong> %${(order.tax * 100).toFixed(0)}</p>
                    <p><strong>KDV Tutarı:</strong> ${this.formatCurrency(order.totalPrice - (order.totalPrice / (1 + order.tax)))}</p>
                </div>
            </div>
            <hr>
            <h6>Sipariş Kalemleri</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Ürün</th>
                            <th>Miktar</th>
                            <th>Birim Fiyat</th>
                            <th>Toplam</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.orderDetails ? order.orderDetails.map(detail => {
                            const stock = this.stocks.find(s => s.stockId === detail.stockId);
                            const stockName = stock ? stock.stockName : 'Bilinmeyen Ürün';
                            const price = stock ? stock.price : 0;
                            const total = price * detail.amount;
                            
                            return `
                                <tr>
                                    <td>${stockName}</td>
                                    <td>${detail.amount}</td>
                                    <td>${this.formatCurrency(price)}</td>
                                    <td>${this.formatCurrency(total)}</td>
                                </tr>
                            `;
                        }).join('') : '<tr><td colspan="4">Detay bulunamadı</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('orderDetailsContent').innerHTML = content;
        new bootstrap.Modal(document.getElementById('orderDetailsModal')).show();
    }

    formatDate(dateString) {
        if (!dateString) return 'Belirtilmemiş';
        try {
            return new Date(dateString).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    formatCurrency(amount) {
        if (amount === undefined || amount === null) return '₺0,00';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    }

    showLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const ordersContainer = document.getElementById('ordersContainer');
        const errorMessage = document.getElementById('errorMessage');
        
        if (loadingSpinner) loadingSpinner.style.display = 'flex';
        if (ordersContainer) ordersContainer.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
    }

    hideLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const ordersContainer = document.getElementById('ordersContainer');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (ordersContainer) ordersContainer.style.display = 'block';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        this.hideLoading();
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
        toast.style.zIndex = '1060';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toast);
        });
    }
}

// Global order manager instance
let orderManager;
document.addEventListener('DOMContentLoaded', function() {
    orderManager = new OrderManager();
});

function createOrder() {
    if (orderManager) orderManager.createOrder();
}

function toggleOrderList() {
    if (orderManager) orderManager.toggleOrderList();
}