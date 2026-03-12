import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
    Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, 
    Panel, Handle, Position, MiniMap, reconnectEdge, ConnectionMode,
    NodeResizer
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Trash2, Save, X, Camera, CheckSquare, Activity, Square, AlertTriangle, LayoutGrid, Undo2, Redo2, Pencil, CheckCircle2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { formatMoney } from '../lib/utils';

// Custom Node for editable text
const CustomEditableNode = ({ data, id, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(data.title || 'DRAFT STRATEGI');

  const handleBlur = () => {
    setIsEditing(false);
    data.onTextChange(id, text);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    data.onTitleChange(id, title);
  };

  const handleChange = (evt) => {
    setText(evt.target.value);
  };

  const nodeColorClass = data.color === 'green' ? 'border-emerald-500' 
    : data.color === 'red' ? 'border-rose-500' 
    : data.color === 'yellow' ? 'border-amber-500' 
    : 'border-blue-500';

  return (
    <>
      <NodeResizer color="#3b82f6" isVisible={isConnectable} minWidth={200} minHeight={100} />
      <div 
         className={`bg-white dark:bg-[#1f2937] border-2 ${nodeColorClass} rounded-lg p-3 shadow-md transition-colors w-full h-full`}
      >
        <Handle type="target" position={Position.Top} id="top-t" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400" />
      <Handle type="source" position={Position.Top} id="top-s" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400 opacity-0" />
      
      <Handle type="target" position={Position.Left} id="left-t" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400" />
      <Handle type="source" position={Position.Left} id="left-s" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400 opacity-0" />
      
      <Handle type="target" position={Position.Right} id="right-t" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400 opacity-0" />
      <Handle type="source" position={Position.Right} id="right-s" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400" />
      
      <Handle type="target" position={Position.Bottom} id="bottom-t" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400 opacity-0" />
      
      <div className="flex flex-col">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 tracking-wider uppercase flex justify-between items-center group">
              <div className="flex-1 mr-2 truncate">
                {isEditingTitle ? (
                  <input
                    autoFocus
                    className="w-full bg-slate-100 dark:bg-[#0a0e17] text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded outline-none border border-blue-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                  />
                ) : (
                  <span 
                    className="cursor-text hover:text-blue-500 transition-colors"
                    onDoubleClick={() => setIsEditingTitle(true)}
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {title || 'DRAFT STRATEGI'}
                  </span>
                )}
              </div>
              <button onClick={() => data.onDelete(id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"><X className="w-3 h-3" /></button>
          </div>
          {isEditing ? (
            <textarea
              autoFocus
              className="w-full text-sm bg-slate-50 dark:bg-[#0a0e17] text-slate-900 dark:text-slate-200 p-2 rounded border border-blue-500 focus:outline-none resize-none"
              rows="4"
              value={text}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          ) : (
            <div 
              className="text-sm cursor-text text-slate-800 dark:text-slate-300 whitespace-pre-wrap min-h-[60px]" 
              style={{ minWidth: 200, minHeight: 80 }}
              onDoubleClick={() => setIsEditing(true)}
              onClick={() => setIsEditing(true)}
            >
              {text ? (
                 <div>{text.split('\n').map((line, i) => <div key={i}>{line.replace(/^- (.*)/, '• $1')}</div>)}</div>
              ) : (
                 'Klik ganda untuk mengetik...'
              )}
            </div>
          )}
      </div>
      
      <Handle type="source" position={Position.Bottom} id="bottom-s" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400" />
    </div>
    </>
  );
};

// 2. Checklist Node
const ChecklistNode = ({ data, id, isConnectable }) => {
  const [items, setItems] = useState(data.items || [{ text: 'Cek Tren Mayor', done: false }]);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(data.title || 'CHECKLIST');

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    data.onChecklistChange(id, title, items);
  };

  const toggleItem = (idx) => {
    const newItems = [...items];
    newItems[idx].done = !newItems[idx].done;
    setItems(newItems);
    data.onChecklistChange(id, title, newItems);
  };

  const addItem = () => {
    const newItems = [...items, { text: 'Item baru...', done: false }];
    setItems(newItems);
    data.onChecklistChange(id, title, newItems);
  };

  const updateItemText = (idx, newText) => {
    const newItems = [...items];
    newItems[idx].text = newText;
    setItems(newItems);
    data.onChecklistChange(id, title, newItems);
  };

  const removeItem = (idx) => {
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
    data.onChecklistChange(id, title, newItems);
  };

  return (
    <>
      <NodeResizer color="#a855f7" isVisible={isConnectable} minWidth={220} minHeight={120} />
      <div className="bg-white dark:bg-[#1f2937] border-2 border-purple-500 rounded-lg p-3 shadow-md transition-colors w-full h-full flex flex-col">
        <Handle type="target" position={Position.Top} id="top-t-chk" isConnectable={isConnectable} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Top} id="top-s-chk" isConnectable={isConnectable} className="w-3 h-3 bg-purple-500 opacity-0" />
      
      <Handle type="target" position={Position.Left} id="left-t-chk" isConnectable={isConnectable} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Left} id="left-s-chk" isConnectable={isConnectable} className="w-3 h-3 bg-purple-500 opacity-0" />
      
      <Handle type="target" position={Position.Right} id="right-t-chk" isConnectable={isConnectable} className="w-3 h-3 bg-purple-500 opacity-0" />
      <Handle type="source" position={Position.Right} id="right-s-chk" isConnectable={isConnectable} className="w-3 h-3 bg-purple-500" />
      
      <Handle type="target" position={Position.Bottom} id="bottom-t-chk" isConnectable={isConnectable} className="w-3 h-3 bg-purple-500 opacity-0" />
      
      <div className="flex flex-col">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 tracking-wider uppercase flex justify-between items-center group border-b border-slate-200 dark:border-slate-700 pb-1">
              <div className="flex-1 mr-2 truncate">
                {isEditingTitle ? (
                  <input
                    autoFocus
                    className="w-full bg-slate-100 dark:bg-[#0a0e17] text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded outline-none border border-purple-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                  />
                ) : (
                  <span 
                    className="cursor-text hover:text-purple-500 transition-colors flex items-center gap-1"
                    onDoubleClick={() => setIsEditingTitle(true)}
                  >
                    <CheckSquare className="w-3 h-3 text-purple-500" /> {title}
                  </span>
                )}
              </div>
              <button onClick={() => data.onDelete(id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"><X className="w-3 h-3" /></button>
          </div>
          
          <div className="space-y-1.5 min-h-[40px]">
             {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 group/item">
                   <input type="checkbox" checked={item.done} onChange={() => toggleItem(idx)} className="mt-0.5 text-purple-500 rounded focus:ring-purple-500" />
                   <input 
                      type="text" 
                      value={item.text} 
                      onChange={(e) => updateItemText(idx, e.target.value)}
                      className={`text-xs w-full bg-transparent focus:outline-none focus:border-b focus:border-purple-300 dark:focus:border-purple-700 ${item.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}
                   />
                   <button onClick={() => removeItem(idx)} className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
                </div>
             ))}
          </div>
          <button onClick={addItem} className="mt-2 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 py-1 rounded transition-colors w-full">+ Tambah Item</button>
      </div>
      
        <Handle type="source" position={Position.Bottom} id="bottom-s-chk" isConnectable={isConnectable} className="w-3 h-3 bg-purple-500" />
      </div>
    </>
  );
};

// 3. Metric Node (Live Data)
const MetricNode = ({ data, id, isConnectable }) => {
  const [metricType, setMetricType] = useState(data.metricType || 'winrate');

  const handleTypeChange = (e) => {
    setMetricType(e.target.value);
    data.onMetricChange(id, e.target.value);
  };

  // Calculate live value based on data.entries passed down
  let valueDisplay = '--';
  if (data.entries && data.entries.length > 0) {
      if (metricType === 'winrate') {
          const wins = data.entries.filter(e => e.pnl > 0).length;
          valueDisplay = ((wins / data.entries.length) * 100).toFixed(1) + '%';
      } else if (metricType === 'pnl') {
          const total = data.entries.reduce((sum, e) => sum + e.pnl, 0);
          valueDisplay = formatMoney(total);
      } else if (metricType === 'long_winrate') {
          const longs = data.entries.filter(e => e.type === 'Long');
          const wins = longs.filter(e => e.pnl > 0).length;
          valueDisplay = longs.length > 0 ? ((wins / longs.length) * 100).toFixed(1) + '%' : '0%';
      } else if (metricType === 'short_winrate') {
          const shorts = data.entries.filter(e => e.type === 'Short');
          const wins = shorts.filter(e => e.pnl > 0).length;
          valueDisplay = shorts.length > 0 ? ((wins / shorts.length) * 100).toFixed(1) + '%' : '0%';
      } else if (metricType === 'trades') {
          valueDisplay = data.entries.length;
      }
  }

  return (
    <>
    <NodeResizer color="#334155" isVisible={isConnectable} minWidth={200} minHeight={100} />
    <div className="bg-white dark:bg-[#1f2937] border-2 border-slate-700 dark:border-slate-500 rounded-lg p-3 shadow-xl w-[200px] transition-colors relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 dark:bg-slate-400"></div>
      <Handle type="target" position={Position.Top} id="top-t-met" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800" />
      <Handle type="source" position={Position.Top} id="top-s-met" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800 opacity-0" />
      
      <Handle type="target" position={Position.Left} id="left-t-met" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800" />
      <Handle type="source" position={Position.Left} id="left-s-met" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800 opacity-0" />
      
      <Handle type="target" position={Position.Right} id="right-t-met" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800 opacity-0" />
      <Handle type="source" position={Position.Right} id="right-s-met" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800" />
      
      <Handle type="target" position={Position.Bottom} id="bottom-t-met" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800 opacity-0" />
      
      <div className="flex flex-col pl-2">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase flex justify-between items-center group">
              <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-slate-700 dark:text-slate-300" /> Live Metric</span>
              <button onClick={() => data.onDelete(id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"><X className="w-3 h-3" /></button>
          </div>
          
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">{valueDisplay}</div>
          
          <select 
             value={metricType} 
             onChange={handleTypeChange}
             className="text-xs w-full bg-slate-50 dark:bg-[#0a0e17] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded p-1 focus:outline-none"
          >
             <option value="winrate">Total Win Rate (%)</option>
             <option value="pnl">Total Net PnL</option>
             <option value="long_winrate">Win Rate (Long) %</option>
             <option value="short_winrate">Win Rate (Short) %</option>
             <option value="trades">Jumlah Trades</option>
          </select>
      </div>
      
      <Handle type="source" position={Position.Bottom} id="bottom-s-met" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800" />
    </div>
    </>
  );
};


// 4. Group Node (Container)
const GroupNode = ({ data, id }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(data.title || 'GROUP STRATEGI');

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    data.onTitleChange(id, title);
  };

  return (
    <>
      <NodeResizer color="#cbd5e1" minWidth={300} minHeight={200} />
      <div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 transition-colors relative group">
          <div className="absolute top-0 left-0 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-br-lg rounded-tl-lg flex items-center gap-2">
              {isEditingTitle ? (
                  <input
                    autoFocus
                    className="bg-transparent outline-none w-32 border-b border-slate-400"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                  />
                ) : (
                  <span 
                    className="cursor-text hover:text-slate-900 dark:hover:text-white transition-colors"
                    onDoubleClick={() => setIsEditingTitle(true)}
                  >
                    {title}
                  </span>
                )}
              <button onClick={() => data.onDelete(id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 ml-2"><X className="w-3 h-3" /></button>
          </div>
      </div>
    </>
  );
};

const nodeTypes = {
  customText: CustomEditableNode,
  checklist: ChecklistNode,
  metric: MetricNode,
  groupNode: GroupNode
};

const defaultViewport = { x: 0, y: 0, zoom: 1 };

export default function StrategyLabTab({ accountName, entries }) {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    // 12C: Inline Edge Label Editor
    const [editingEdge, setEditingEdge] = useState(null); // { id, label, x, y }

    // 12D: Undo/Redo
    const historyRef = useRef([]);
    const historyIndexRef = useRef(-1);
    const isUndoRedoRef = useRef(false);

    // 12G: Multiple Canvas
    const [canvasList, setCanvasList] = useState(['Default']);
    const [activeCanvas, setActiveCanvas] = useState('Default');
    const [editingCanvasName, setEditingCanvasName] = useState(null); // { index, value } or null
    const [isAddingCanvas, setIsAddingCanvas] = useState(false);
    const [newCanvasName, setNewCanvasName] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved

    // Initial load from Electron Store
    useEffect(() => {
        const loadFlow = async () => {
            const key = `pnl_strategy_flow_${accountName || 'Main'}_${activeCanvas}`;
            try {
                let savedData;
                if (window.electronAPI) {
                    savedData = await window.electronAPI.storeGet(key);
                } else {
                    savedData = localStorage.getItem(key);
                }

                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    
                    // Hydrate nodes with callback functions
                    const hydratedNodes = (parsed.nodes || []).map(node => ({
                        ...node,
                        data: {
                            ...node.data,
                            entries,
                            onTextChange: stableOnTextChange,
                            onTitleChange: stableOnTitleChange,
                            onChecklistChange: stableOnChecklistChange,
                            onMetricChange: stableOnMetricChange,
                            onDelete: stableOnDelete
                        }
                    }));
                    
                    setNodes(hydratedNodes);
                    setEdges(parsed.edges || []);
                    if (parsed.viewport && reactFlowInstance) {
                       reactFlowInstance.setViewport(parsed.viewport);
                    }
                } else {
                    // Default state
                    const initialId = `node_${Date.now()}`;
                    setNodes([{
                        id: initialId,
                        type: 'customText',
                        position: { x: 250, y: 150 },
                        data: { color: 'blue', title: 'SOP Utama', label: 'Contoh: Beli Breakout saat RSI < 70\n1. Tunggu konfirmasi close.\n2. Titik Stop Loss di...', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete }
                    }]);
                    setEdges([]);
                }
            } catch (err) {
                console.error("Failed to load flow:", err);
            }
        };
        
        loadFlow();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountName, activeCanvas, reactFlowInstance]);

    // Update entries dependency separately for Metric nodes
    useEffect(() => {
        setNodes(nds => nds.map(n => {
            if (n.type === 'metric') {
                return { ...n, data: { ...n.data, entries } };
            }
            return n;
        }));
    }, [entries]);

    // Save flow automatically or on command
    const saveFlow = useCallback(() => {
        if (!reactFlowInstance) return;
        
        // Strip out the non-serializable callbacks/entries from node data before saving
        const serializableNodes = nodes.map(n => {
            const safeData = { ...n.data };
            delete safeData.entries;
            delete safeData.onTextChange;
            delete safeData.onTitleChange;
            delete safeData.onChecklistChange;
            delete safeData.onMetricChange;
            delete safeData.onDelete;
            return {
                ...n,
                data: safeData
            };
        });

        const flowData = {
            nodes: serializableNodes,
            edges,
            viewport: reactFlowInstance.getViewport()
        };

        const key = `pnl_strategy_flow_${accountName || 'Main'}_${activeCanvas}`;
        if (window.electronAPI) {
            window.electronAPI.storeSet(key, JSON.stringify(flowData));
        } else {
            localStorage.setItem(key, JSON.stringify(flowData));
        }
    }, [nodes, edges, reactFlowInstance, accountName]);

    // 12B: Auto-save debounced (2 seconds after last change) + 14C status indicator
    useEffect(() => {
        if (nodes.length === 0) return;
        setSaveStatus('saving');
        const timer = setTimeout(() => { 
            saveFlow(); 
            setSaveStatus('saved');
            const resetTimer = setTimeout(() => setSaveStatus('idle'), 2000);
            return () => clearTimeout(resetTimer);
        }, 2000);
        return () => clearTimeout(timer);
    }, [nodes, edges, saveFlow]);

    // Stable callback refs — these never go stale
    const deleteNodeRef = useRef(null);
    const updateNodeTextRef = useRef(null);
    const updateNodeTitleRef = useRef(null);
    const updateChecklistRef = useRef(null);
    const updateMetricTypeRef = useRef(null);

    // Node Callbacks
    const updateNodeText = useCallback((nodeId, newText) => {
        setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, label: newText } } : node));
    }, []);

    const updateNodeTitle = useCallback((nodeId, newTitle) => {
        setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, title: newTitle } } : node));
    }, []);

    const updateChecklist = useCallback((nodeId, newTitle, newItems) => {
        setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, title: newTitle, items: newItems } } : node));
    }, []);

    const updateMetricType = useCallback((nodeId, newType) => {
        setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, metricType: newType } } : node));
    }, []);

    const deleteNode = useCallback((nodeId) => {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    }, []);

    // Keep refs always pointing to latest
    deleteNodeRef.current = deleteNode;
    updateNodeTextRef.current = updateNodeText;
    updateNodeTitleRef.current = updateNodeTitle;
    updateChecklistRef.current = updateChecklist;
    updateMetricTypeRef.current = updateMetricType;

    // Stable wrappers that never become stale closures
    const stableOnDelete = useCallback((id) => deleteNodeRef.current(id), []);
    const stableOnTextChange = useCallback((id, t) => updateNodeTextRef.current(id, t), []);
    const stableOnTitleChange = useCallback((id, t) => updateNodeTitleRef.current(id, t), []);
    const stableOnChecklistChange = useCallback((id, title, items) => updateChecklistRef.current(id, title, items), []);
    const stableOnMetricChange = useCallback((id, t) => updateMetricTypeRef.current(id, t), []);


    const onNodesChange = useCallback((changes) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange = useCallback((changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const onConnect = useCallback((params) => {
        const newEdge = { 
            ...params, 
            type: 'smoothstep', 
            animated: true, 
            labelStyle: { fill: '#64748b', fontWeight: 600, fontSize: 10 },
            labelBgStyle: { fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1, rx: 4, ry: 4 },
            labelBgPadding: [4, 4],
            style: { stroke: '#3b82f6', strokeWidth: 2 } 
        };
        setEdges((eds) => addEdge(newEdge, eds));
    }, []);

    const edgeReconnectSuccessful = useRef(true);

    const onReconnectStart = useCallback(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = useCallback((oldEdge, newConnection) => {
        edgeReconnectSuccessful.current = true;
        setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    }, []);

    const onReconnectEnd = useCallback((_, edge) => {
        if (!edgeReconnectSuccessful.current) {
            // Reconnect gagal (drop di tempat kosong) — jangan hapus edge
            // Edge tetap di posisi semula
        }
        edgeReconnectSuccessful.current = true;
    }, []);

    const onEdgeDoubleClick = useCallback((event, edge) => {
        event.preventDefault();
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        setEditingEdge({
            id: edge.id,
            label: edge.label || '',
            x: event.clientX - (bounds?.left || 0),
            y: event.clientY - (bounds?.top || 0)
        });
    }, []);

    const onEdgeContextMenu = useCallback((event, edge) => {
        event.preventDefault();
        if (window.confirm("✂️ Putus/Hapus garis sambungan ini?")) {
            setEdges((eds) => eds.filter(e => e.id !== edge.id));
        }
    }, []);
    const spawnNode = (type, color = 'blue') => {
        const id = `node_${Date.now()}`;
        const position = {
            x: Math.random() * 200 + 100,
            y: Math.random() * 200 + 100
        };

        let newNode = { id, position, type };

        if (type === 'customText') {
            newNode.data = { color, title: 'SOP TAHAP 1', label: '', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete };
            newNode.style = { width: 250, height: 150 };
        } else if (type === 'checklist') {
            newNode.data = { title: 'Daftar Periksa', items: [{ text: 'Market sedang trending', done: false }], onChecklistChange: stableOnChecklistChange, onDelete: stableOnDelete };
            newNode.style = { width: 250, height: 200 };
        } else if (type === 'metric') {
            newNode.data = { metricType: 'winrate', entries, onMetricChange: stableOnMetricChange, onDelete: stableOnDelete };
        } else if (type === 'groupNode') {
            newNode.data = { title: 'Sesi New York', onTitleChange: stableOnTitleChange, onDelete: stableOnDelete };
            newNode.style = { width: 400, height: 300, zIndex: -1 };
        }

        setNodes((nds) => [...nds, newNode]);
    };

    const exportToImage = () => {
        if (!reactFlowWrapper.current) return;
        toPng(reactFlowWrapper.current, { filter: (node) => !(node?.classList?.contains('react-flow__controls') || node?.classList?.contains('react-flow__minimap')) })
          .then((dataUrl) => {
              const a = document.createElement('a');
              a.setAttribute('download', `MyPnL_Strategy_${accountName}_${Date.now()}.png`);
              a.setAttribute('href', dataUrl);
              a.click();
          })
          .catch((error) => console.error('Error exporting image:', error));
    };

    // 12D: Undo/Redo
    const pushHistory = useCallback(() => {
        if (isUndoRedoRef.current) { isUndoRedoRef.current = false; return; }
        const snap = JSON.stringify({ nodes, edges });
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(snap);
        if (historyRef.current.length > 30) historyRef.current.shift();
        historyIndexRef.current = historyRef.current.length - 1;
    }, [nodes, edges]);

    useEffect(() => { pushHistory(); }, [nodes, edges, pushHistory]);

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        isUndoRedoRef.current = true;
        const snap = JSON.parse(historyRef.current[historyIndexRef.current]);
        setNodes(snap.nodes); setEdges(snap.edges);
    }, []);

    const redo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return;
        historyIndexRef.current++;
        isUndoRedoRef.current = true;
        const snap = JSON.parse(historyRef.current[historyIndexRef.current]);
        setNodes(snap.nodes); setEdges(snap.edges);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo]);

    // 12G: Canvas management
    const saveCanvasList = (list) => {
        const listKey = `pnl_strategy_canvases_${accountName || 'Main'}`;
        if (window.electronAPI) window.electronAPI.storeSet(listKey, JSON.stringify(list));
        else localStorage.setItem(listKey, JSON.stringify(list));
    };

    const addCanvas = () => {
        setNewCanvasName(`Strategi ${canvasList.length + 1}`);
        setIsAddingCanvas(true);
    };

    const confirmAddCanvas = () => {
        const name = newCanvasName.trim();
        if (name && !canvasList.includes(name)) {
            const newList = [...canvasList, name];
            setCanvasList(newList);
            setActiveCanvas(name);
            saveCanvasList(newList);
        }
        setIsAddingCanvas(false);
        setNewCanvasName('');
    };

    const renameCanvas = (index) => {
        const val = editingCanvasName?.value?.trim();
        if (val && val !== canvasList[index] && !canvasList.includes(val)) {
            const oldName = canvasList[index];
            const newList = [...canvasList];
            newList[index] = val;
            setCanvasList(newList);
            if (activeCanvas === oldName) setActiveCanvas(val);
            saveCanvasList(newList);
            // Migrate saved data to new key
            const oldKey = `pnl_strategy_flow_${accountName || 'Main'}_${oldName}`;
            const newKey = `pnl_strategy_flow_${accountName || 'Main'}_${val}`;
            if (window.electronAPI) {
                window.electronAPI.storeGet(oldKey).then(d => { if (d) { window.electronAPI.storeSet(newKey, d); window.electronAPI.storeSet(oldKey, ''); } });
            } else {
                const d = localStorage.getItem(oldKey); if (d) { localStorage.setItem(newKey, d); localStorage.removeItem(oldKey); }
            }
        }
        setEditingCanvasName(null);
    };

    const deleteCanvas = () => {
        if (canvasList.length <= 1) return;
        const newList = canvasList.filter(c => c !== activeCanvas);
        setCanvasList(newList);
        setActiveCanvas(newList[0]);
        saveCanvasList(newList);
        setConfirmingDelete(false);
    };

    // Load canvas list on mount
    useEffect(() => {
        const loadCanvasList = async () => {
            const listKey = `pnl_strategy_canvases_${accountName || 'Main'}`;
            let saved;
            if (window.electronAPI) saved = await window.electronAPI.storeGet(listKey);
            else saved = localStorage.getItem(listKey);
            if (saved) { const parsed = JSON.parse(saved); setCanvasList(parsed); setActiveCanvas(parsed[0] || 'Default'); }
        };
        loadCanvasList();
    }, [accountName]);

    // 12H: Templates
    const loadTemplate = (templateName) => {
        const ts = Date.now();
        let tplNodes = []; let tplEdges = [];
        if (templateName === 'breakout') {
            tplNodes = [
              { id: `n1_${ts}`, type: 'checklist', position: { x: 50, y: 50 }, style: { width: 250, height: 200 }, data: { title: 'PRE-TRADE CHECK', items: [{ text: 'Market trending (ADX > 25)', done: false }, { text: 'Support/Resistance teridentifikasi', done: false }, { text: 'Volume meningkat', done: false }], onChecklistChange: stableOnChecklistChange, onDelete: stableOnDelete } },
              { id: `n2_${ts}`, type: 'customText', position: { x: 380, y: 50 }, style: { width: 250, height: 150 }, data: { color: 'green', title: 'ENTRY RULES', label: '1. Harga breakout di atas resistance\n2. Konfirmasi candle close\n3. RSI < 70 (belum overbought)', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete } },
              { id: `n3_${ts}`, type: 'customText', position: { x: 380, y: 250 }, style: { width: 250, height: 150 }, data: { color: 'red', title: 'EXIT & RISK', label: '- Stop Loss: Di bawah support terdekat\n- Take Profit: 1.5x RR ratio\n- Max risk: 2% per trade', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete } },
            ];
            tplEdges = [
              { id: `e1_${ts}`, source: `n1_${ts}`, target: `n2_${ts}`, sourceHandle: 'right-s', targetHandle: 'left-t', type: 'smoothstep', animated: true, label: 'Semua ✓', style: { stroke: '#10b981', strokeWidth: 2 } },
              { id: `e2_${ts}`, source: `n2_${ts}`, target: `n3_${ts}`, sourceHandle: 'bottom-s', targetHandle: 'top-t', type: 'smoothstep', animated: true, label: 'Eksekusi', style: { stroke: '#3b82f6', strokeWidth: 2 } },
            ];
        } else if (templateName === 'scalping') {
            tplNodes = [
              { id: `n1_${ts}`, type: 'customText', position: { x: 50, y: 50 }, style: { width: 250, height: 130 }, data: { color: 'blue', title: 'SETUP SCALPING', label: 'Timeframe: 1m / 5m\nPair: BTC/USDT\nSesi: London / NY Open', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete } },
              { id: `n2_${ts}`, type: 'customText', position: { x: 350, y: 50 }, style: { width: 250, height: 130 }, data: { color: 'yellow', title: 'KONFIRMASI', label: '- EMA 9 cross EMA 21\n- Volume spike > 2x avg\n- Spread < 0.05%', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete } },
              { id: `n3_${ts}`, type: 'customText', position: { x: 200, y: 230 }, style: { width: 250, height: 130 }, data: { color: 'red', title: 'RISK KETAT', label: '- TP: 5-10 pips\n- SL: 3-5 pips\n- Max 5 trades/hari', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete } },
            ];
            tplEdges = [
              { id: `e1_${ts}`, source: `n1_${ts}`, target: `n2_${ts}`, type: 'smoothstep', animated: true, label: 'Cek', style: { stroke: '#3b82f6', strokeWidth: 2 } },
              { id: `e2_${ts}`, source: `n2_${ts}`, target: `n3_${ts}`, type: 'smoothstep', animated: true, label: 'Valid?', style: { stroke: '#f59e0b', strokeWidth: 2 } },
            ];
        } else if (templateName === 'swing') {
            tplNodes = [
              { id: `n1_${ts}`, type: 'customText', position: { x: 50, y: 50 }, style: { width: 260, height: 150 }, data: { color: 'blue', title: 'ANALISIS MACRO', label: 'Timeframe: Daily / 4H\n- Identifikasi tren utama\n- Tandai zona S/R kunci\n- Cek berita fundamental', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete } },
              { id: `n2_${ts}`, type: 'checklist', position: { x: 370, y: 50 }, style: { width: 250, height: 200 }, data: { title: 'VALIDASI ENTRY', items: [{ text: 'Pullback ke zona S/R', done: false }, { text: 'Reversal candle pattern', done: false }, { text: 'Divergence RSI/MACD', done: false }, { text: 'Risk < 1% account', done: false }], onChecklistChange: stableOnChecklistChange, onDelete: stableOnDelete } },
              { id: `n3_${ts}`, type: 'customText', position: { x: 200, y: 300 }, style: { width: 260, height: 130 }, data: { color: 'green', title: 'MANAJEMEN POSISI', label: '- Partial TP di 1:1 RR\n- Trail stop ke breakeven\n- Hold sisanya untuk 1:3 RR', onTextChange: stableOnTextChange, onTitleChange: stableOnTitleChange, onDelete: stableOnDelete } },
            ];
            tplEdges = [
              { id: `e1_${ts}`, source: `n1_${ts}`, target: `n2_${ts}`, type: 'smoothstep', animated: true, label: 'Konfirmasi', style: { stroke: '#3b82f6', strokeWidth: 2 } },
              { id: `e2_${ts}`, source: `n2_${ts}`, target: `n3_${ts}`, type: 'smoothstep', animated: true, label: 'Entry', style: { stroke: '#10b981', strokeWidth: 2 } },
            ];
        }
        setNodes(tplNodes); setEdges(tplEdges);
    };

    // 12C: Edge label save
    const saveEdgeLabel = () => {
        if (!editingEdge) return;
        setEdges(eds => eds.map(e => e.id === editingEdge.id ? { ...e, label: editingEdge.label } : e));
        setEditingEdge(null);
    };

    return (
        <div className="bg-slate-50 dark:bg-[#0a0e17] border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
            
            {/* Header Toolbar */}
            <div className="bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800/60 px-4 py-2 flex items-center justify-between z-10">
                 <div className="flex items-center gap-3">
                     <h2 className="text-base font-bold text-slate-900 dark:text-white">Strategy Lab</h2>
                     
                     {/* 12G: Canvas Tabs */}
                     <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5">
                         {canvasList.map((c, idx) => (
                             editingCanvasName?.index === idx ? (
                                 <input key={`edit-${idx}`} autoFocus type="text" value={editingCanvasName.value}
                                     onChange={(e) => setEditingCanvasName({ index: idx, value: e.target.value })}
                                     onKeyDown={(e) => { if (e.key === 'Enter') renameCanvas(idx); if (e.key === 'Escape') setEditingCanvasName(null); }}
                                     onBlur={() => renameCanvas(idx)}
                                     className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-blue-400 focus:outline-none w-24"
                                 />
                             ) : (
                                 <button key={c} onClick={() => setActiveCanvas(c)}
                                     onDoubleClick={() => setEditingCanvasName({ index: idx, value: c })}
                                     className={`group/tab px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center ${c === activeCanvas ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                     title="Double-click untuk rename"
                                 >{c}</button>
                             )
                         ))}
                         {isAddingCanvas ? (
                             <input autoFocus type="text" value={newCanvasName}
                                 onChange={(e) => setNewCanvasName(e.target.value)}
                                 onKeyDown={(e) => { if (e.key === 'Enter') confirmAddCanvas(); if (e.key === 'Escape') { setIsAddingCanvas(false); setNewCanvasName(''); } }}
                                 onBlur={confirmAddCanvas}
                                 className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-emerald-400 focus:outline-none w-24"
                                 placeholder="Nama kanvas..."
                             />
                         ) : (
                             <button onClick={addCanvas} className="px-1.5 py-1 text-slate-400 hover:text-emerald-500 transition-colors" title="Kanvas Baru"><Plus className="w-3.5 h-3.5" /></button>
                         )}
                         {canvasList.length > 1 && (
                             confirmingDelete ? (
                                 <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 rounded-md px-1.5 py-0.5 animate-pulse">
                                     <span className="text-[10px] text-rose-400 font-medium">Hapus?</span>
                                     <button onClick={deleteCanvas} className="text-[10px] px-1.5 py-0.5 bg-rose-500 text-white rounded font-bold hover:bg-rose-600 transition-colors">Ya</button>
                                     <button onClick={() => setConfirmingDelete(false)} className="text-[10px] px-1.5 py-0.5 text-slate-400 hover:text-white transition-colors">Batal</button>
                                 </div>
                             ) : (
                                 <button onClick={() => setConfirmingDelete(true)} className="px-1 py-1 text-slate-400 hover:text-rose-500 transition-colors" title="Hapus Kanvas"><Trash2 className="w-3 h-3" /></button>
                             )
                         )}
                     </div>
                 </div>
                 
                 <div className="flex gap-1 items-center">
                     {/* 14C: Auto-save status */}
                     {saveStatus === 'saved' && <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1 mr-1"><CheckCircle2 className="w-3 h-3" /> Tersimpan</span>}
                     {saveStatus === 'saving' && <span className="text-[10px] text-slate-400 font-medium mr-1">Menyimpan...</span>}

                     {/* 12H: Templates */}
                     <div className="relative group">
                         <button className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 rounded-md transition-colors text-[11px] font-semibold px-2.5" title="Template Strategi">📋 Template</button>
                         <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-50 py-1">
                             <button onClick={() => loadTemplate('breakout')} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">🟢 Breakout Strategy</button>
                             <button onClick={() => loadTemplate('scalping')} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">⚡ Scalping Strategy</button>
                             <button onClick={() => loadTemplate('swing')} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">📊 Swing Trading</button>
                         </div>
                     </div>

                     {/* 14B: Separator + Uniform Undo/Redo */}
                     <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
                     <button onClick={undo} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1" title="Undo (Ctrl+Z)"><Undo2 className="w-3.5 h-3.5" /></button>
                     <button onClick={redo} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1" title="Redo (Ctrl+Y)"><Redo2 className="w-3.5 h-3.5" /></button>

                     {/* 14B: Separator + Export */}
                     <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
                     <button onClick={exportToImage} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 text-[10px] font-medium" title="Export sebagai PNG"><Download className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Export</span></button>
                     <button onClick={saveFlow} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-md text-sm font-semibold transition-colors"><Save className="w-4 h-4" /> Simpan</button>
                  </div>
            </div>

            {/* Canvas Area with Sidebar */}
            <div className="flex-1 w-full relative flex" ref={reactFlowWrapper}>
                
                {/* 14A: Tools Sidebar with labels & descriptive icons */}
                <div className="absolute left-4 top-4 z-10 flex flex-col gap-1 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-lg items-center" style={{ width: '52px' }}>
                    <button onClick={() => spawnNode('customText', 'blue')} className="p-1.5 flex flex-col items-center justify-center w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all gap-0.5" title="Teks Biasa">
                        <Square className="w-4 h-4 text-blue-500" fill="#3b82f6" fillOpacity="0.2" />
                        <span className="text-[7px] font-medium text-slate-400">Teks</span>
                    </button>
                    <button onClick={() => spawnNode('customText', 'green')} className="p-1.5 flex flex-col items-center justify-center w-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all gap-0.5" title="Kondisi / Entry">
                        <Square className="w-4 h-4 text-emerald-500" fill="#10b981" fillOpacity="0.2" />
                        <span className="text-[7px] font-medium text-slate-400">Entry</span>
                    </button>
                    <button onClick={() => spawnNode('customText', 'red')} className="p-1.5 flex flex-col items-center justify-center w-full hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all gap-0.5" title="Risiko / Exit">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span className="text-[7px] font-medium text-slate-400">Risiko</span>
                    </button>
                    <button onClick={() => spawnNode('customText', 'yellow')} className="p-1.5 flex flex-col items-center justify-center w-full hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all gap-0.5" title="Peringatan / Catatan">
                        <Square className="w-4 h-4 text-amber-500" fill="#f59e0b" fillOpacity="0.2" />
                        <span className="text-[7px] font-medium text-slate-400">Alert</span>
                    </button>
                    <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-0.5"></div>
                    <button onClick={() => spawnNode('checklist')} className="p-1.5 flex flex-col items-center justify-center w-full hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all gap-0.5" title="Daftar Periksa">
                        <CheckSquare className="w-4 h-4 text-purple-500" />
                        <span className="text-[7px] font-medium text-slate-400">Ceklis</span>
                    </button>
                    <button onClick={() => spawnNode('metric')} className="p-1.5 flex flex-col items-center justify-center w-full hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all gap-0.5" title="Metrik Live">
                        <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-[7px] font-medium text-slate-400">Metrik</span>
                    </button>
                    <button onClick={() => spawnNode('groupNode')} className="p-1.5 flex flex-col items-center justify-center w-full hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all gap-0.5" title="Grup/Area Container">
                        <LayoutGrid className="w-4 h-4 text-slate-400" />
                        <span className="text-[7px] font-medium text-slate-400">Grup</span>
                    </button>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onReconnect={onReconnect}
                    onReconnectStart={onReconnectStart}
                    onReconnectEnd={onReconnectEnd}
                    onEdgeDoubleClick={onEdgeDoubleClick}
                    onEdgeContextMenu={onEdgeContextMenu}
                    nodeTypes={nodeTypes}
                    onInit={setReactFlowInstance}
                    fitView
                    defaultViewport={defaultViewport}
                    deleteKeyCode={['Backspace', 'Delete']}
                    className="dark:bg-[#0a0e17] bg-slate-50"
                    minZoom={0.1}
                    snapToGrid={true}
                    snapGrid={[16, 16]}
                    connectionMode={ConnectionMode.Loose}
                    connectOnClick={true}
                >
                    <Background color="#94a3b8" gap={16} size={1} />
                    <Controls />
                    <MiniMap 
                        nodeColor={(n) => {
                            if (n.type === 'checklist') return '#a855f7';
                            if (n.type === 'metric') return '#334155';
                            if (n.data?.color === 'red') return '#f43f5e';
                            if (n.data?.color === 'green') return '#10b981';
                            if (n.data?.color === 'yellow') return '#f59e0b';
                            return '#3b82f6';
                        }}
                        style={{ backgroundColor: 'var(--tw-colors-slate-50)', maskImage: 'linear-gradient(to bottom, transparent, black)' }} 
                        className="dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm"
                    />
                </ReactFlow>

                {/* 12C: Inline Edge Label Popup */}
                {editingEdge && (
                    <div className="absolute z-50 bg-white dark:bg-[#1f2937] border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl p-2 flex gap-1.5 items-center" style={{ left: editingEdge.x, top: editingEdge.y }}>
                        <input autoFocus type="text" value={editingEdge.label} onChange={(e) => setEditingEdge(prev => ({...prev, label: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') saveEdgeLabel(); if (e.key === 'Escape') setEditingEdge(null); }}
                            className="text-xs bg-slate-50 dark:bg-[#0a0e17] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 w-36 focus:outline-none focus:border-blue-500" placeholder="Label..." />
                        <button onClick={saveEdgeLabel} className="text-[10px] px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold">OK</button>
                        <button onClick={() => setEditingEdge(null)} className="text-[10px] px-1.5 py-1 text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
                    </div>
                )}
            </div>
        </div>
    );
}
