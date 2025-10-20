// api.js - API Configuration
const API_BASE_URL = 'https://localhost:7202/api';

class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            if (response.status === 204) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    static async get(endpoint) {
        return this.request(endpoint);
    }

    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// API Service
class ApiService {
    // Tüm siparişleri getir
    static async getAllOrders() {
        return API.get('/Orders');
    }

    // SADECE AKTİF siparişleri getir (isActive=true olanlar)
    static async getOrders() {
        const allOrders = await this.getAllOrders();
        console.log('🔍 Tüm siparişler:', allOrders);
        
        const activeOrders = allOrders.filter(order => {
            const isActive = order.isActive;
            console.log(`🔍 Aktif Filtre: ${order.orderNo} - isActive:`, isActive, 'type:', typeof isActive);
            
            // Tüm olası true değerlerini kontrol et
            if (isActive === true || 
                isActive === 'true' || 
                isActive === 1 || 
                isActive === '1') {
                console.log(`✅ ${order.orderNo} - AKTİF olarak kabul edildi`);
                return true;
            }
            
            // undefined/null ise varsayılan olarak aktif kabul et
            if (isActive === null || isActive === undefined) {
                console.log(`✅ ${order.orderNo} - Varsayılan AKTİF (null/undefined)`);
                return true;
            }
            
            console.log(`🚫 ${order.orderNo} - İNAKTİF olarak filtrelendi`);
            return false;
        });
        
        console.log('✅ Aktif siparişler:', activeOrders.length);
        return activeOrders;
    } 

    // SADECE İNAKTİF siparişleri getir (isActive=false olanlar)
    static async getInactiveOrders() {
        const allOrders = await this.getAllOrders();
        console.log('🔍 Tüm siparişler (inactive için):', allOrders);
        
        const inactiveOrders = allOrders.filter(order => {
            const isActive = order.isActive;
            console.log(`🔍 Inactive Filtre: ${order.orderNo} - isActive:`, isActive, 'type:', typeof isActive);
            
            // Tüm olası false değerlerini kontrol et
            if (isActive === false || 
                isActive === 'false' || 
                isActive === 0 || 
                isActive === '0') {
                console.log(`✅ ${order.orderNo} - İNAKTİF olarak kabul edildi`);
                return true;
            }
            
            console.log(`🚫 ${order.orderNo} - AKTİF olarak filtrelendi`);
            return false;
        });
        
        console.log('📋 Inactive siparişler:', inactiveOrders.length);
        console.log('📋 Inactive sipariş listesi:', inactiveOrders);
        return inactiveOrders;
    }

    static async getOrderById(id) {
        return API.get(`/Orders/${id}`);
    }

    static async createOrder(orderData) {
        return API.post('/Orders', orderData);
    }

    static async updateOrder(id, orderData) {
        return API.put(`/Orders/${id}`, orderData);
    }

    static async deleteOrder(id) {
        return API.delete(`/Orders/${id}`);
    }

    // Siparişi geri yükle - Basitleştirilmiş versiyon
    static async restoreOrder(id) {
        try {
            console.log('🔄 Sipariş geri yükleniyor:', id);
            
            // Önce mevcut siparişi al (order details dahil)
            const currentOrder = await this.getOrderById(id);
            console.log('📋 Mevcut sipariş ve detayları:', currentOrder);
            
            // Sadece isActive değişikliği için minimal data
            const updateData = {
                orderId: currentOrder.orderId,
                customerId: currentOrder.customerId,
                orderDate: currentOrder.orderDate,
                orderNo: currentOrder.orderNo,
                totalPrice: currentOrder.totalPrice,
                tax: currentOrder.tax,
                deliveryAddressId: currentOrder.deliveryAddressId || 1,
                invoiceAddressId: currentOrder.invoiceAddressId || 1,
                isActive: true, // Sadece bu değişiyor
                orderDetails: currentOrder.orderDetails ? currentOrder.orderDetails.map(detail => ({
                    orderDetailId: detail.orderDetailId || 0,
                    stockId: detail.stockId,
                    amount: detail.amount,
                    stockName: detail.stockName || "",
                    price: detail.price || 0
                })) : []
            };
            
            console.log('📤 Gönderilen order details:', updateData.orderDetails);
            
            const result = await API.put(`/Orders/${id}`, updateData);
            console.log('✅ Sipariş geri yüklendi:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Sipariş geri yükleme hatası:', error);
            throw error;
        }
    }

    // Customer methods
    static async getCustomers() {
        return API.get('/Customers');
    }

    // Stock methods
    static async getStocks() {
        return API.get('/Stocks');
    }

    // Customer Address methods - YENİ EKLENDİ
static async getCustomerAddresses(customerId) {
    try {
        // DOĞRU endpoint: /api/Customers/{customerId}/addresses
        const response = await API.get(`/Customers/${customerId}/addresses`);
        console.log('📬 API CustomerAddresses response:', response);
        return response;
    } catch (error) {
        console.error('Müşteri adresleri getirilirken hata:', error);
        
        // Hata durumunda boş array döndür (frontend'in çökmesini engelle)
        if (error.message.includes('404') || error.message.includes('500')) {
            console.log('⚠️  Adresler bulunamadı, boş array döndürülüyor');
            return [];
        }
        throw error;
    }
}
}