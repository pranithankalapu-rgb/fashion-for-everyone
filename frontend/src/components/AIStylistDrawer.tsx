import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, ShoppingBag, DollarSign, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { RetailProduct } from '../types/fashion';

interface AIStylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: RetailProduct) => void;
  onAddToCart?: (product: RetailProduct) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendedProducts?: RetailProduct[];
}

export const AIStylistDrawer: React.FC<AIStylistDrawerProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onAddToCart,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI Haute Stylist. Tell me your occasion, budget, or vibe (e.g., "I need a sleek black-tie dinner outfit under $300"), and I will curate the perfect designer match from our collection.',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [occasion, setOccasion] = useState<string>('All');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage;
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsTyping(true);

    try {
      const response = await api.chatStylist(userText, {
        budget,
        occasion: occasion !== 'All' ? occasion : undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.content,
          recommendedProducts: response.recommendedProducts,
        },
      ]);
    } catch (err) {
      console.error('Stylist chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I encountered an issue querying the fashion catalogue. Let me suggest our bestselling classic pieces.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-100 flex items-center gap-2">
                Conversational AI Stylist
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">Contextual occasion & budget styling engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filters */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Budget:
          </span>
          {[150, 300, 500].map((b) => (
            <button
              key={b}
              onClick={() => setBudget(budget === b ? undefined : b)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                budget === b
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              &lt; ${b}
            </button>
          ))}

          <span className="text-slate-400 text-[11px] font-semibold ml-2 shrink-0">Occasion:</span>
          {['Work', 'Date night', 'Casual'].map((occ) => (
            <button
              key={occ}
              onClick={() => setOccasion(occasion === occ ? 'All' : occ)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                occasion === occ
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-3`}>
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Recommended Product Cards in chat */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {msg.recommendedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-100 truncate">{prod.title}</h4>
                          <p className="text-[11px] text-amber-400 font-bold">${prod.price}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {onSelectProduct && (
                            <button
                              onClick={() => onSelectProduct(prod)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold cursor-pointer"
                            >
                              View
                            </button>
                          )}
                          {onAddToCart && (
                            <button
                              onClick={() => onAddToCart(prod)}
                              className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 cursor-pointer"
                              title="Add to bag"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold p-2">
              <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
              <span>AI Stylist analyzing silhouette & color palettes...</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/80 flex gap-2">
          <input
            type="text"
            placeholder="Ask for an outfit, budget, or advice..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-400 outline-none"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
