import React, { useState } from 'react';
import type { RetailProduct, CustomerOrder, RetailerCustomer, Promotion, StoreSettings, OrderStatus } from '../types/fashion';
import {
  RETAIL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_RETAILER_CUSTOMERS,
  INITIAL_PROMOTIONS,
  INITIAL_STORE_SETTINGS,
} from '../data/fashionData';

import { RetailerDashboard } from './retailer/RetailerDashboard';
import { RetailerProducts } from './retailer/RetailerProducts';
import { RetailerInventory } from './retailer/RetailerInventory';
import { RetailerOrders } from './retailer/RetailerOrders';
import { RetailerCustomers } from './retailer/RetailerCustomers';
import { RetailerAnalytics } from './retailer/RetailerAnalytics';
import { RetailerPromotions } from './retailer/RetailerPromotions';
import { RetailerSettings } from './retailer/RetailerSettings';

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
  const [customers] = useState<RetailerCustomer[]>(INITIAL_RETAILER_CUSTOMERS);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);

  // Trigger modal helper flag
  const [addModalRequested, setAddModalRequested] = useState<boolean>(false);

  // Product CRUD Handlers
  const handleAddProduct = (newProduct: Omit<RetailProduct, 'id'>) => {
    const created: RetailProduct = {
      ...newProduct,
      id: `prod_${Date.now()}`,
    };
    setProducts((prev) => [created, ...prev]);
  };

  const handleUpdateProduct = (updated: RetailProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const status = newStock === 0 ? 'Out of Stock' : newStock <= 5 ? 'Low Stock' : 'Active';
          return { ...p, stockQuantity: newStock, status };
        }
        return p;
      })
    );
  };

  // Order Handlers
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => {
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
  };

  // Promotion Handlers
  const handleCreatePromotion = (newPromo: Omit<Promotion, 'id' | 'usageCount'>) => {
    const created: Promotion = {
      ...newPromo,
      id: `promo_${Date.now()}`,
      usageCount: 0,
    };
    setPromotions((prev) => [created, ...prev]);
  };

  const handleUpdatePromotion = (updated: Promotion) => {
    setPromotions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleToggleDeactivatePromotion = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStatus = p.status === 'Active' ? 'Inactive' : 'Active';
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

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
            onSaveSettings={setSettings}
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

  return <div className="w-full min-w-0 space-y-4">{renderSection()}</div>;
};
