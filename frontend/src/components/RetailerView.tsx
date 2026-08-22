import React, { useState, useEffect } from 'react';
import type { RetailProduct, CustomerOrder, RetailerCustomer, Promotion, StoreSettings, OrderStatus } from '../types/fashion';
import {
  RETAIL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_RETAILER_CUSTOMERS,
  INITIAL_PROMOTIONS,
  INITIAL_STORE_SETTINGS,
} from '../data/fashionData';
import { api } from '../services/api';

import { RetailerDashboard } from './retailer/RetailerDashboard';
import { RetailerProducts } from './retailer/RetailerProducts';
import { RetailerInventory } from './retailer/RetailerInventory';
import { RetailerOrders } from './retailer/RetailerOrders';
import { RetailerCustomers } from './retailer/RetailerCustomers';
import { RetailerAnalytics } from './retailer/RetailerAnalytics';
import { RetailerPromotions } from './retailer/RetailerPromotions';
import { RetailerSettings } from './retailer/RetailerSettings';
import { Loader2 } from 'lucide-react';

interface RetailerViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery?: string;
}

export const RetailerView: React.FC<RetailerViewProps> = ({
  activeTab,
  setActiveTab,
}) => {
  // State management for retailer operations
  const [products, setProducts] = useState<RetailProduct[]>(RETAIL_PRODUCTS);
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [customers, setCustomers] = useState<RetailerCustomer[]>(INITIAL_RETAILER_CUSTOMERS);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Trigger modal helper flag
  const [addModalRequested, setAddModalRequested] = useState<boolean>(false);

  // Load backend data on mount
  useEffect(() => {
    async function loadRetailerData() {
      setLoading(true);
      setErrorAlert(null);
      try {
        const [prods, ords, custs, promos, sets] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
          api.getRetailerCustomers(),
          api.getPromotions(),
          api.getStoreSettings(),
        ]);
        setProducts(prods);
        setOrders(ords);
        setCustomers(custs);
        setPromotions(promos);
        setSettings(sets);
      } catch (err: any) {
        console.error('Failed to load retailer data from API:', err);
        setErrorAlert(err.message || 'Unable to connect to backend server. Using local cache.');
      } finally {
        setLoading(false);
      }
    }
    loadRetailerData();
  }, []);

  // Product CRUD Handlers with Backend API Persistence
  const handleAddProduct = async (newProduct: Omit<RetailProduct, 'id'>) => {
    try {
      const created = await api.createProduct(newProduct);
      setProducts((prev) => [created, ...prev]);
    } catch (err: any) {
      console.error('Failed to create product via API:', err);
      // Fallback local update
      const fallback: RetailProduct = { ...newProduct, id: `prod_${Date.now()}` };
      setProducts((prev) => [fallback, ...prev]);
    }
  };

  const handleUpdateProduct = async (updated: RetailProduct) => {
    try {
      const result = await api.updateProduct(updated.id, updated);
      setProducts((prev) => prev.map((p) => (p.id === result.id ? result : p)));
    } catch (err: any) {
      console.error('Failed to update product via API:', err);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error('Failed to delete product via API:', err);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const updated = await api.updateProductStock(productId, newStock);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      console.error('Failed to update product stock via API:', err);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            const status = newStock === 0 ? 'Out of Stock' : newStock <= 5 ? 'Low Stock' : 'Active';
            return { ...p, stockQuantity: newStock, status };
          }
          return p;
        })
      );
    }
  };

  // Order Handlers with Backend API Persistence
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus, trackingNumber);
      setOrders((prev) => prev.map((o) => (o.id === updated.id || o.orderNumber === updated.orderNumber ? updated : o)));
    } catch (err: any) {
      console.error('Failed to update order status via API:', err);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              status: newStatus,
              trackingNumber: trackingNumber ?? o.trackingNumber,
            };
          }
          return o;
        })
      );
    }
  };

  // Promotion Handlers with Backend API Persistence
  const handleCreatePromotion = async (newPromo: Omit<Promotion, 'id' | 'usageCount'>) => {
    try {
      const created = await api.createPromotion(newPromo);
      setPromotions((prev) => [created, ...prev]);
    } catch (err: any) {
      console.error('Failed to create promotion via API:', err);
      const fallback: Promotion = { ...newPromo, id: `promo_${Date.now()}`, usageCount: 0 };
      setPromotions((prev) => [fallback, ...prev]);
    }
  };

  const handleUpdatePromotion = async (updated: Promotion) => {
    try {
      const res = await api.updatePromotion(updated.id, updated);
      setPromotions((prev) => prev.map((p) => (p.id === res.id ? res : p)));
    } catch (err: any) {
      console.error('Failed to update promotion via API:', err);
      setPromotions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  };

  const handleToggleDeactivatePromotion = async (id: string) => {
    try {
      const updated = await api.toggleDeactivatePromotion(id);
      setPromotions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      console.error('Failed to toggle promotion status via API:', err);
      setPromotions((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const newStatus = p.status === 'Active' ? 'Inactive' : 'Active';
            return { ...p, status: newStatus };
          }
          return p;
        })
      );
    }
  };

  // Settings Save Handler with Backend API Persistence
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    try {
      const res = await api.updateStoreSettings(newSettings);
      setSettings(res.settings);
    } catch (err: any) {
      console.error('Failed to save store settings via API:', err);
      setSettings(newSettings);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm text-theme-muted font-medium">Synchronizing Retailer Operations with Backend Database...</p>
      </div>
    );
  }

  // Render Sub-Section based on activeTab
  const renderSection = () => {
    switch (activeTab) {
      case 'retailer-products':
        return (
          <RetailerProducts
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            initialAddModalOpen={addModalRequested}
          />
        );

      case 'retailer-inventory':
        return (
          <RetailerInventory
            products={products}
            onUpdateStock={handleUpdateStock}
          />
        );

      case 'retailer-orders':
        return (
          <RetailerOrders
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        );

      case 'retailer-customers':
        return <RetailerCustomers customers={customers} />;

      case 'retailer-analytics':
        return <RetailerAnalytics orders={orders} products={products} />;

      case 'retailer-promotions':
        return (
          <RetailerPromotions
            promotions={promotions}
            onCreatePromotion={handleCreatePromotion}
            onUpdatePromotion={handleUpdatePromotion}
            onToggleDeactivate={handleToggleDeactivatePromotion}
          />
        );

      case 'retailer-settings':
        return (
          <RetailerSettings
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        );

      case 'retailer-dashboard':
      default:
        return (
          <RetailerDashboard
            orders={orders}
            products={products}
            onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab !== 'retailer-products') setAddModalRequested(false);
            }}
            onOpenAddProduct={() => setAddModalRequested(true)}
          />
        );
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {errorAlert && (
        <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex justify-between items-center">
          <span>{errorAlert}</span>
          <button onClick={() => setErrorAlert(null)} className="text-amber-400 font-bold hover:underline">Dismiss</button>
        </div>
      )}
      {renderSection()}
    </div>
  );
};
