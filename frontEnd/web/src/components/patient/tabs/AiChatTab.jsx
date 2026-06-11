// ============================================================
// components/patient/tabs/AiChatTab.jsx
// ------------------------------------------------------------
// Onglet "IA Santé" — assistant médical conversationnel.
// Simule une conversation avec une IA via des réponses
// basées sur des mots-clés.
//
// Note : pour une vraie IA, remplacer handleSendChat dans
// useAppData.js par un appel à l'API Gemini.
// ============================================================

import { Bot, Send } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * @param {Array}    chatMessages  - Historique des messages
 * @param {string}   newMessage    - Message en cours de saisie
 * @param {Function} setNewMessage
 * @param {boolean}  isAiTyping    - Animation "en train d'écrire"
 * @param {object}   chatEndRef    - Ref pour le scroll automatique
 * @param {Function} handleSendChat - Envoie le message
 */
export default function AiChatTab({
  chatMessages, newMessage, setNewMessage,
  isAiTyping, chatEndRef, handleSendChat,
}) {
  return (
    <motion.div
      key="ai"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[calc(100vh-8rem)] bg-[#f8f9fc]"
    >
      {/* ── En-tête de l'assistant ── */}
      <div className="bg-white border-b border-neutral-150 p-4 flex gap-3.5 items-center shadow-sm shrink-0">
        {/* Avatar de l'IA avec indicateur "en ligne" */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0088FF] to-[#01579B] text-white flex items-center justify-center shadow-md relative shrink-0">
          <Bot size={22} className="animate-pulse" />
          <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 bg-emerald-500 rounded-full border border-white" />
        </div>
        <div>
          <h3 className="font-extrabold text-neutral-900 text-sm">Assistant Santé Virtuel</h3>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide mt-0.5">
            Disponibilité Immédiate · IA Clinique
          </p>
        </div>
      </div>

      {/* ── Zone de messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col">
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed relative ${
              msg.sender === 'user'
                // Message utilisateur : bleu, aligné à droite
                ? 'bg-gradient-to-r from-[#0088FF] to-[#007BFF] text-white self-end rounded-tr-sm shadow-md'
                // Message IA : blanc, aligné à gauche
                : 'bg-white border border-neutral-200/60 text-neutral-800 self-start rounded-tl-sm shadow-sm'
            }`}
          >
            <p className="font-medium">{msg.text}</p>
            {/* Timestamp en bas à droite */}
            <span className={`text-[9px] absolute bottom-1 right-3 font-bold opacity-60 ${msg.sender === 'user' ? 'text-white' : 'text-neutral-400'}`}>
              {msg.time}
            </span>
          </div>
        ))}

        {/* Animation "IA en train d'écrire" (3 points qui bougent) */}
        {isAiTyping && (
          <div className="bg-white border border-neutral-200/60 rounded-3xl rounded-tl-sm px-4 py-3 self-start flex items-center gap-1 shadow-sm">
            {[0, 150, 300].map(delay => (
              <span
                key={delay}
                className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        )}

        {/* Ancre invisible pour le scroll automatique */}
        <div ref={chatEndRef} />
      </div>

      {/* ── Zone de saisie ── */}
      <div className="p-4 bg-white border-t border-neutral-100 flex gap-2.5 items-center shrink-0">
        <input
          type="text"
          placeholder="Décrivez vos symptômes..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          // Envoi au clavier avec la touche Entrée
          onKeyDown={e => e.key === 'Enter' && handleSendChat()}
          className="flex-grow bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-[#0078FF] rounded-2xl py-3 px-4 text-xs text-neutral-800 outline-none"
        />
        <button
          onClick={handleSendChat}
          className="w-11 h-11 bg-[#0078FF] hover:bg-[#0066DD] text-white rounded-xl shadow-md flex items-center justify-center shrink-0 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </motion.div>
  );
}
