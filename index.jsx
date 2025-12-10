import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Paperclip, Zap, X, Image as ImageIcon, 
  Settings, LogOut, Lock, Mail, User, 
  ChevronLeft, Save, Trash2, Palette, 
  Bell, Volume2, Globe, CheckCircle,
  Menu, Plus, MessageSquare, MoreVertical,
  Github, Folder, FolderPlus, ChevronDown, ChevronRight,
  GripVertical, ListOrdered, FileText, Layout
} from 'lucide-react';

// --- CONFIGURAÇÃO E TEMAS ---
const DEFAULT_API_KEY = "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"; // Substitua pela sua chave se necessário
const DEFAULT_MODEL = "llama-3.2-11b-vision-preview"; 

// NOVO PROMPT FOCADO EM PASSO A PASSO
const DEFAULT_SYSTEM_PROMPT = `Você é o NEXUS, um instrutor especialista em tutoriais e guias técnicos.
SEU OBJETIVO PRINCIPAL: Analisar o conteúdo enviado (imagem, texto ou link) e criar um GUIA PASSO A PASSO detalhado, lógico e prático.
1. Não faça apenas resumos. Quebre a informação em etapas numeradas (1, 2, 3...).
2. Se for uma imagem de erro/código, dê o passo a passo para corrigir.
3. Se for um link de produto/artigo, dê o passo a passo de como usar ou as principais conclusões em ordem lógica.
4. Use formatação Markdown rica (negrito, listas, blocos de código).
5. Mantenha um tom profissional, direto e educativo.`;

const THEMES = {
  nexus: {
    name: 'Nexus (Padrão)',
    colors: {
      bg: 'bg-slate-950',
      sidebar: 'bg-slate-900/95',
      primary: 'bg-cyan-600',
      text: 'text-cyan-400',
      textHighlight: 'text-cyan-200',
      gradientBg: 'from-cyan-500 to-blue-600',
      button: 'from-cyan-600 to-blue-700 shadow-cyan-500/20 hover:shadow-cyan-500/40',
      glow: 'bg-cyan-400',
      borderFocus: 'focus-within:border-cyan-500/50',
      userMsg: 'bg-gradient-to-br from-cyan-900/40 to-blue-900/20 border-cyan-500/20',
      aiMsg: 'bg-slate-900/80 border-white/5',
      sidebarActive: 'bg-cyan-500/10 border-l-2 border-cyan-400 text-cyan-100',
      folderText: 'text-cyan-200'
    }
  },
  obsidian: {
    name: 'Obsidian',
    colors: {
      bg: 'bg-neutral-950',
      sidebar: 'bg-neutral-900/95',
      primary: 'bg-violet-600',
      text: 'text-violet-400',
      textHighlight: 'text-violet-200',
      gradientBg: 'from-violet-500 to-fuchsia-600',
      button: 'from-violet-600 to-fuchsia-700 shadow-violet-500/20 hover:shadow-violet-500/40',
      glow: 'bg-violet-400',
      borderFocus: 'focus-within:border-violet-500/50',
      userMsg: 'bg-gradient-to-br from-violet-900/40 to-fuchsia-900/20 border-violet-500/20',
      aiMsg: 'bg-neutral-900/80 border-white/5',
      sidebarActive: 'bg-violet-500/10 border-l-2 border-violet-400 text-violet-100',
      folderText: 'text-violet-200'
    }
  },
  emerald: {
    name: 'Emerald City',
    colors: {
      bg: 'bg-slate-950',
      sidebar: 'bg-emerald-950/30',
      primary: 'bg-emerald-600',
      text: 'text-emerald-400',
      textHighlight: 'text-emerald-200',
      gradientBg: 'from-emerald-500 to-teal-600',
      button: 'from-emerald-600 to-teal-700 shadow-emerald-500/20 hover:shadow-emerald-500/40',
      glow: 'bg-emerald-400',
      borderFocus: 'focus-within:border-emerald-500/50',
      userMsg: 'bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border-emerald-500/20',
      aiMsg: 'bg-slate-900/80 border-white/5',
      sidebarActive: 'bg-emerald-500/10 border-l-2 border-emerald-400 text-emerald-100',
      folderText: 'text-emerald-200'
    }
  }
};

// --- COMPONENTES VISUAIS ---

const TypingIndicator = ({ theme }) => (
  <div className="flex space-x-1 items-center p-2">
    <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${theme.colors.glow}`}></div>
    <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${theme.colors.glow} opacity-70`}></div>
    <div className={`w-1.5 h-1.5 rounded-full animate-bounce bg-white/50`}></div>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, theme }) => {
  const baseStyle = "p-2.5 rounded-lg transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantStyle = "";
  if (variant === 'primary') variantStyle = `bg-gradient-to-r text-white shadow-lg ${theme.colors.button}`;
  else if (variant === 'secondary') variantStyle = "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/5";
  else if (variant === 'danger') variantStyle = "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20";
  else if (variant === 'social') variantStyle = "bg-white text-slate-900 hover:bg-slate-200 border border-transparent font-bold";
  else if (variant === 'social-dark') variantStyle = "bg-[#24292e] text-white hover:bg-slate-800 border border-white/10";

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variantStyle} ${className}`}>
      {children}
    </button>
  );
};

const InputField = ({ icon: Icon, type = "text", placeholder, value, onChange, label, theme, readOnly = false }) => (
  <div className="space-y-1 w-full">
    {label && <label className="text-xs text-slate-400 ml-1 font-medium tracking-wide">{label}</label>}
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${theme.colors.gradientBg} rounded-lg opacity-0 ${readOnly ? '' : 'group-focus-within:opacity-30'} transition duration-500 blur-md`}></div>
      <div className={`relative flex items-center bg-slate-950/80 border border-white/10 rounded-lg overflow-hidden ${readOnly ? 'opacity-70 cursor-not-allowed' : theme.colors.borderFocus} transition-colors backdrop-blur-sm`}>
        <div className="p-3 text-slate-500">
          <Icon size={16} />
        </div>
        <input 
          type={type} 
          value={value} 
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full bg-transparent text-slate-200 placeholder-slate-600 p-2.5 pl-0 focus:outline-none text-sm ${readOnly ? 'cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  </div>
);

// --- TELAS ---

const AuthScreen = ({ onLogin, themeKey }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const theme = THEMES[themeKey];

  const handleStandardLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: name || 'Usuário', email, type: 'standard' });
    }, 1000);
  };

  const handleSocialLogin = (provider) => {
    setLoading(true);
    // Simulação de login social
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: `${provider} User`, email: `user@${provider.toLowerCase()}.com`, type: provider });
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-in fade-in zoom-in duration-500">
      <div className="w-full max-w-md relative">
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] animate-pulse opacity-20 ${theme.colors.glow.replace('bg-', 'bg-')}`}></div>
        <div className={`absolute bottom-0 left-0 w-40 h-40 rounded-full blur-[80px] animate-pulse [animation-delay:1s] opacity-20 bg-blue-500`}></div>

        <div className="relative bg-slate-950/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className={`p-4 bg-slate-900/80 rounded-2xl border border-white/10 mb-4 shadow-[0_0_30px_rgba(0,0,0,0.3)]`}>
              <Zap size={32} className={theme.colors.text} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              NEXUS
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">Step-by-Step Intelligence</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button variant="social" onClick={() => handleSocialLogin('Google')} theme={theme}>
               <span className="text-orange-500 font-bold">G</span> Google
            </Button>
            <Button variant="social-dark" onClick={() => handleSocialLogin('GitHub')} theme={theme}>
              <Github size={16} /> GitHub
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/50 px-2 text-slate-500">Ou continue com email</span>
            </div>
          </div>

          <form onSubmit={handleStandardLogin} className="space-y-4">
            {!isLogin && (
              <InputField icon={User} placeholder="Seu Nome" value={name} onChange={(e) => setName(e.target.value)} theme={theme} />
            )}
            <InputField icon={Mail} type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} theme={theme} />
            <InputField icon={Lock} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} theme={theme} />

            <Button className="w-full mt-4 h-12 text-base" disabled={loading} theme={theme}>
              {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className={`text-xs text-slate-500 hover:${theme.colors.text} transition-colors font-medium`}
            >
              {isLogin ? "Criar uma nova conta" : "Já tem conta? Entrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SIDEBAR REDIMENSIONÁVEL & PASTAS ---

const Sidebar = ({ 
  isOpen, 
  user, 
  chats, 
  folders, 
  activeChatId,
  theme,
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onCreateFolder,
  onDeleteFolder,
  onMoveChatToFolder,
  onSettings,
  onToggleSidebar,
  width,
  setWidth
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const sidebarRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  // Resize Logic
  const startResizing = useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth > 200 && newWidth < 480) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing, setWidth]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);


  const toggleFolder = (folderId) => {
    setCollapsedFolders(prev => ({...prev, [folderId]: !prev[folderId]}));
  };

  // Chats soltos (sem pasta ou pasta 'root')
  const rootChats = chats.filter(c => !c.folderId || c.folderId === 'root');

  const ChatItem = ({ chat }) => (
    <div 
      onClick={() => onSelectChat(chat.id)}
      className={`
        group relative p-2.5 rounded-lg cursor-pointer transition-all border border-transparent mb-1
        ${activeChatId === chat.id 
          ? theme.colors.sidebarActive 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }
      `}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <ListOrdered size={14} className="shrink-0 opacity-70" />
        <span className="text-xs font-medium truncate">{chat.title}</span>
      </div>
      
      {/* Menu flutuante para deletar/mover (simples por enquanto) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <select 
          className="w-4 h-4 opacity-0 absolute inset-0 cursor-pointer"
          onChange={(e) => onMoveChatToFolder(chat.id, e.target.value)}
          value={chat.folderId || 'root'}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="root">Raiz</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <div className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white" title="Mover">
            <Folder size={12} />
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
          className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <aside 
      ref={sidebarRef}
      style={{ width: isOpen ? (window.innerWidth < 768 ? '100%' : `${width}px`) : '0px' }}
      className={`
        fixed md:relative z-30 h-full ${theme.colors.sidebar} backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 ease-out overflow-hidden
        ${!isOpen ? '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      {/* Cabeçalho Sidebar */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-800 rounded-lg border border-white/5">
            <Layout size={18} className={theme.colors.text} />
          </div>
          <span className="font-bold tracking-wide text-sm text-slate-200">Biblioteca</span>
        </div>
        <div className="flex gap-1">
             <button onClick={onCreateFolder} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md" title="Nova Pasta">
                <FolderPlus size={16} />
             </button>
             <button onClick={onToggleSidebar} className="md:hidden p-1.5 text-slate-400">
                <X size={18} />
             </button>
        </div>
      </div>

      <div className="p-3 shrink-0">
        <button 
          onClick={onNewChat}
          className={`w-full p-2.5 rounded-lg bg-gradient-to-r ${theme.colors.button} flex items-center justify-center gap-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95`}
        >
          <Plus size={14} strokeWidth={3} /> NOVO GUIA
        </button>
      </div>

      {/* Lista de Pastas e Chats */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
         
         {/* Pastas */}
         {folders.map(folder => (
            <div key={folder.id} className="mb-2">
               <div 
                  className={`flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer group text-xs font-bold uppercase tracking-wider ${theme.colors.folderText}`}
                  onClick={() => toggleFolder(folder.id)}
               >
                  <div className="flex items-center gap-2">
                     {collapsedFolders[folder.id] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                     <Folder size={12} className={theme.colors.text} />
                     <span>{folder.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1"
                  >
                    <Trash2 size={10} />
                  </button>
               </div>
               
               {!collapsedFolders[folder.id] && (
                  <div className="ml-2 pl-2 border-l border-white/5 mt-1">
                     {chats.filter(c => c.folderId === folder.id).map(chat => (
                        <ChatItem key={chat.id} chat={chat} />
                     ))}
                     {chats.filter(c => c.folderId === folder.id).length === 0 && (
                        <div className="text-[10px] text-slate-600 p-2 italic">Pasta vazia</div>
                     )}
                  </div>
               )}
            </div>
         ))}

         {/* Chats na Raiz */}
         {folders.length > 0 && <div className="my-2 border-t border-white/5" />}
         {rootChats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
      </div>

      {/* Rodapé User */}
      <div className="p-3 border-t border-white/5 shrink-0 bg-black/20">
         <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition cursor-pointer" onClick={onSettings}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold border border-white/10 shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium truncate text-slate-200">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  {user?.type === 'standard' ? 'Free Plan' : 'Pro Plan'}
              </p>
            </div>
            <Settings size={14} className="text-slate-500" />
         </div>
      </div>

      {/* Resizer Handle (Desktop only) */}
      <div
        className="hidden md:block absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-cyan-500/50 transition-colors z-40 group"
        onMouseDown={startResizing}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 opacity-0 group-hover:opacity-100 bg-slate-800 rounded p-0.5 border border-white/10">
            <GripVertical size={12} className="text-slate-400" />
        </div>
      </div>
    </aside>
  );
};

// --- SETTINGS SCREEN (MANTIDO E ADAPTADO) ---
const SettingsScreen = ({ settings, setSettings, user, setUser, onBack, onLogout, theme }) => {
   // ... (Lógica similar à anterior, apenas com classes de layout limpas)
   // Simplificado para brevidade, mas mantendo a funcionalidade
   const [localSettings, setLocalSettings] = useState(settings);
   const [isSaved, setIsSaved] = useState(false);

   const handleSave = () => {
    setSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
   };

   return (
    <div className={`h-full flex flex-col ${theme.colors.bg} animate-in slide-in-from-right duration-300`}>
        <header className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-slate-950/50">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition">
                <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-white">Configurações</h2>
        </header>
        <div className="p-6 max-w-2xl mx-auto w-full space-y-8">
            <section>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${theme.colors.text}`}>Visual</h3>
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(THEMES).map(([key, t]) => (
                        <button
                        key={key}
                        onClick={() => setLocalSettings({...localSettings, theme: key})}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${localSettings.theme === key ? `bg-white/10 border-${theme.colors.glow.split('-')[1]}-500` : 'bg-slate-900 border-white/5'}`}
                        >
                            <div className={`w-full h-8 rounded bg-gradient-to-r ${t.colors.gradientBg}`}></div>
                            <span className="text-xs text-slate-300">{t.name}</span>
                        </button>
                    ))}
                </div>
            </section>
            
            <section>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${theme.colors.text}`}>Conta</h3>
                <Button variant="danger" onClick={onLogout} theme={theme} className="w-full">
                    <LogOut size={16} /> Sair da Conta
                </Button>
            </section>

            <div className="pt-4">
                <Button onClick={handleSave} className="w-full" theme={theme}>
                    <Save size={16} /> {isSaved ? 'Salvo!' : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    </div>
   );
};

// --- APP MAIN ---

export default function App() {
  const [view, setView] = useState('auth'); 
  const [user, setUser] = useState(null);
  
  const [settings, setSettings] = useState({
    apiKey: '',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    model: DEFAULT_MODEL,
    theme: 'nexus',
    notifications: true,
  });

  // State
  const [chats, setChats] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const theme = THEMES[settings.theme] || THEMES['nexus'];

  // Init
  useEffect(() => {
    if (view === 'chat' && chats.length === 0) {
      handleNewChat();
    }
  }, [view]);

  // Active Chat
  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat ? activeChat.messages : [];

  useEffect(() => {
    if (view === 'chat') scrollToBottom();
  }, [messages, view, activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- ACTIONS ---

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newChat = {
      id: newId,
      title: 'Novo Guia',
      folderId: 'root',
      messages: [{
         role: 'assistant',
         content: `Olá, ${user?.name?.split(' ')[0] || 'Viajante'}. \nEstou pronto para criar um passo a passo. Envie um link, texto ou imagem.`,
         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }],
      timestamp: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteChat = (chatId) => {
    const newChats = chats.filter(c => c.id !== chatId);
    setChats(newChats);
    if (activeChatId === chatId) {
      setActiveChatId(newChats.length > 0 ? newChats[0].id : null);
    }
  };

  const handleCreateFolder = () => {
    const name = prompt("Nome da nova pasta:", "Projetos");
    if (name) {
        setFolders([...folders, { id: Date.now().toString(), name }]);
    }
  };

  const handleDeleteFolder = (folderId) => {
      if(window.confirm("Deletar pasta? Os chats voltarão para a raiz.")){
          setFolders(folders.filter(f => f.id !== folderId));
          setChats(chats.map(c => c.folderId === folderId ? { ...c, folderId: 'root' } : c));
      }
  };

  const handleMoveChatToFolder = (chatId, folderId) => {
      setChats(chats.map(c => c.id === chatId ? { ...c, folderId } : c));
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading || !activeChatId) return;

    const userContent = input;
    const file = selectedFile;
    
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);

    const displayMsg = {
      role: 'user',
      content: userContent,
      image: file ? URL.createObjectURL(file) : null,
      fileName: file ? file.name : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update Local State with User Message
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        let newTitle = chat.title;
        // Auto-title logic logic update
        if (chat.messages.length <= 1 && userContent) {
           newTitle = userContent.slice(0, 30);
        } else if (chat.messages.length <= 1 && file) {
           newTitle = `Análise: ${file.name}`;
        }
        return { ...chat, messages: [...chat.messages, displayMsg], title: newTitle };
      }
      return chat;
    }));

    // API Interaction
    try {
        // Encode image
        let base64Image = null;
        if (file) {
             base64Image = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
             });
        }

        const apiMessages = [
            { role: "system", content: settings.systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
        ];

        // Format user message for vision model
        const userPayload = [];
        if (userContent) userPayload.push({ type: "text", text: userContent });
        else userPayload.push({ type: "text", text: "Gere um guia passo a passo baseado neste arquivo." });
        
        if (base64Image) {
            userPayload.push({ type: "image_url", image_url: { url: base64Image } });
        }

        apiMessages.push({ role: "user", content: userPayload });

        const activeKey = settings.apiKey.trim() || DEFAULT_API_KEY;
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${activeKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: apiMessages,
                model: settings.model,
                temperature: 0.6, // Lower temperature for more structured guides
                max_tokens: 2048,
            })
        });

        if (!response.ok) throw new Error("Erro na conexão com Neural Net");
        const data = await response.json();
        const aiText = data.choices[0]?.message?.content || "Sem resposta.";

        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c, messages: [...c.messages, displayMsg, {
                role: 'assistant',
                content: aiText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]
        } : c));

    } catch (error) {
        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c, messages: [...c.messages, displayMsg, {
                role: 'assistant',
                content: `⚠️ Erro: ${error.message}`,
                isError: true,
                timestamp: new Date().toLocaleTimeString()
            }]
        } : c));
    } finally {
        setIsLoading(false);
    }
  };

  // --- RENDER ---

  if (view === 'auth') {
    return (
        <div className={`h-screen ${theme.colors.bg} text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden`}>
            <AuthScreen onLogin={(u) => { setUser(u); setView('chat'); }} themeKey={settings.theme} />
        </div>
    );
  }

  if (view === 'settings') {
    return (
        <SettingsScreen 
            settings={settings} setSettings={setSettings} user={user}
            onBack={() => setView('chat')} onLogout={() => setView('auth')} theme={theme}
        />
    );
  }

  return (
    <div className={`flex h-screen ${theme.colors.bg} text-slate-200 font-sans overflow-hidden`}>
        
        <Sidebar 
            isOpen={sidebarOpen}
            width={sidebarWidth}
            setWidth={setSidebarWidth}
            theme={theme}
            user={user}
            chats={chats}
            folders={folders}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onSelectChat={(id) => { setActiveChatId(id); if (window.innerWidth < 768) setSidebarOpen(false); }}
            onDeleteChat={handleDeleteChat}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveChatToFolder={handleMoveChatToFolder}
            onSettings={() => setView('settings')}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col h-full relative w-full bg-slate-950/50">
            
            {/* Header Mobile/Desktop */}
            <header className="flex items-center justify-between px-4 py-3 bg-slate-900/50 backdrop-blur-md border-b border-white/5 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition">
                        <Menu size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                           <FileText size={14} className={theme.colors.text} />
                           {activeChat?.title || 'Novo Guia'}
                        </h1>
                    </div>
                </div>
                <div className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-white/5 ${theme.colors.text}`}>
                    Passo-a-Passo Mode
                </div>
            </header>

            {/* Chat Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                        <ListOrdered size={64} className="mb-4 text-slate-700" />
                        <p className="font-medium">Comece um novo guia passo a passo</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                        <div className={`flex flex-col max-w-[90%] md:max-w-[75%] gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            
                            <div className="flex items-center gap-2 opacity-60 px-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider">{msg.role === 'user' ? 'Você' : 'Nexus AI'}</span>
                                <span className="text-[10px]">{msg.timestamp}</span>
                            </div>

                            <div className={`
                                relative p-5 rounded-2xl shadow-xl backdrop-blur-sm border
                                ${msg.role === 'user' ? `${theme.colors.userMsg} rounded-tr-sm` : `${theme.colors.aiMsg} rounded-tl-sm`}
                                ${msg.isError ? 'border-red-500/30 bg-red-900/10' : ''}
                            `}>
                                {msg.image && (
                                    <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                                        <img src={msg.image} alt="Upload" className="max-h-80 w-auto object-cover" />
                                    </div>
                                )}
                                
                                <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-slate-200">
                                    {/* Renderização simples de quebras de linha para o demo. Em prod, usar ReactMarkdown */}
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className="min-h-[1em] mb-1">{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className={`${theme.colors.aiMsg} p-3 rounded-2xl rounded-tl-sm`}>
                            <TypingIndicator theme={theme} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Footer */}
            <footer className="p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-20">
                <div className="max-w-4xl mx-auto">
                    <div className={`
                        relative flex flex-col bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300
                        ${isLoading ? 'opacity-80 pointer-events-none' : theme.colors.borderFocus} focus-within:ring-1 focus-within:ring-cyan-500/30
                    `}>
                        
                        {selectedFile && (
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 border-b border-white/5">
                                <div className={`flex items-center gap-2 text-xs font-bold ${theme.colors.text}`}>
                                    <ImageIcon size={14} />
                                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                </div>
                                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-end p-2 gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-3 text-slate-400 hover:${theme.colors.text} hover:bg-white/5 rounded-xl transition-all`}
                                title="Anexar arquivo para análise"
                            >
                                <Paperclip size={20} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={(e) => {if(e.target.files) setSelectedFile(e.target.files[0])}} className="hidden" />

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
                                placeholder="Descreva o que você quer aprender ou cole um link..."
                                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none py-3 max-h-32 scrollbar-hide"
                                rows={1}
                            />

                            <Button onClick={handleSend} disabled={(!input.trim() && !selectedFile) || isLoading} theme={theme} className="h-[44px] w-[44px] !p-0 rounded-xl">
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                            </Button>
                        </div>
                    </div>
                    <div className="text-center mt-3 text-[10px] text-slate-600 font-medium tracking-wider uppercase">
                        AI Guide Generator • v3.0
                    </div>
                </div>
            </footer>
        </div>
    </div>
  );
}
