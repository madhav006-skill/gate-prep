import React, { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal } from 'lucide-react';

const VirtualCalculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState(0);
  const [isRad, setIsRad] = useState(false); // false = Deg, true = Rad
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 150, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const inputDigit = (digit) => {
    if (waitingForNewValue) {
      setDisplay(String(digit));
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const backspace = () => {
    if (waitingForNewValue) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const performOperation = (nextOperator) => {
    const inputValue = parseFloat(display);

    if (prevValue == null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      let newValue = 0;
      switch (operator) {
        case '+': newValue = currentValue + inputValue; break;
        case '-': newValue = currentValue - inputValue; break;
        case '*': newValue = currentValue * inputValue; break;
        case '/': newValue = currentValue / inputValue; break;
        case 'y^x': newValue = Math.pow(currentValue, inputValue); break;
        case 'yrootx': newValue = Math.pow(currentValue, 1/inputValue); break;
        default: break;
      }
      setPrevValue(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForNewValue(true);
    setOperator(nextOperator);
  };

  const executeScientific = (func) => {
    const val = parseFloat(display);
    let res = 0;
    
    // Angle conversion
    const getAngle = (v) => isRad ? v : v * (Math.PI / 180);
    const fromAngle = (v) => isRad ? v : v * (180 / Math.PI);

    switch (func) {
      case 'sin': res = Math.sin(getAngle(val)); break;
      case 'cos': res = Math.cos(getAngle(val)); break;
      case 'tan': res = Math.tan(getAngle(val)); break;
      case 'asin': res = fromAngle(Math.asin(val)); break;
      case 'acos': res = fromAngle(Math.acos(val)); break;
      case 'atan': res = fromAngle(Math.atan(val)); break;
      case 'ln': res = Math.log(val); break;
      case 'log': res = Math.log10(val); break;
      case 'sqrt': res = Math.sqrt(val); break;
      case 'cbrt': res = Math.cbrt(val); break;
      case 'x^2': res = Math.pow(val, 2); break;
      case 'x^3': res = Math.pow(val, 3); break;
      case '1/x': res = 1 / val; break;
      case 'e^x': res = Math.exp(val); break;
      case '10^x': res = Math.pow(10, val); break;
      case 'fact': 
        let f = 1;
        for(let i=2; i<=Math.floor(val); i++) f*=i;
        res = f;
        break;
      default: break;
    }
    setDisplay(String(res));
    setWaitingForNewValue(true);
  };

  return (
    <div 
      className="fixed z-[100] bg-[#e0e0e0] border-2 border-gray-400 rounded-lg shadow-2xl flex flex-col font-sans"
      style={{ left: position.x, top: position.y, width: '320px', userSelect: 'none' }}
    >
      {/* Header / Drag Handle */}
      <div 
        className="bg-blue-800 text-white p-2 flex justify-between items-center rounded-t-md cursor-move"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center text-sm font-bold">
          <GripHorizontal size={16} className="mr-2 opacity-50"/> GATE Calculator
        </div>
        <button onClick={onClose} className="hover:bg-red-600 rounded text-white p-1" onPointerDown={e => e.stopPropagation()}>
          <X size={16}/>
        </button>
      </div>

      {/* Display */}
      <div className="p-3 bg-gray-200">
        <div className="bg-white border-2 border-gray-300 p-2 text-right rounded">
          <div className="text-xs text-gray-500 h-4">{operator ? `${prevValue} ${operator}` : ''}</div>
          <div className="text-2xl font-mono overflow-hidden text-black">{display}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 pb-3 bg-gray-200 grid grid-cols-5 gap-1 text-black font-medium text-xs">
        
        {/* Row 1 */}
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => setIsRad(!isRad)}>{isRad ? 'Rad' : 'Deg'}</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('fact')}>n!</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('sin')}>sin</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('cos')}>cos</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('tan')}>tan</button>

        {/* Row 2 */}
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('1/x')}>1/x</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => performOperation('y^x')}>y^x</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('asin')}>sin⁻¹</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('acos')}>cos⁻¹</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('atan')}>tan⁻¹</button>

        {/* Row 3 */}
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('x^2')}>x²</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('x^3')}>x³</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('log')}>log</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('10^x')}>10^x</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => performOperation('yrootx')}>ʸ√x</button>

        {/* Row 4 */}
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('sqrt')}>√</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('cbrt')}>∛</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('ln')}>ln</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={() => executeScientific('e^x')}>e^x</button>
        <button className="bg-gray-300 hover:bg-gray-400 p-2 rounded" onClick={toggleSign}>±</button>

        {/* Separator / Math pad */}
        <div className="col-span-5 h-1"></div>

        {/* Numpad & Basic Ops */}
        <button className="bg-red-200 hover:bg-red-300 text-red-800 p-2 rounded" onClick={() => { setMemory(0); }}>MC</button>
        <button className="bg-red-200 hover:bg-red-300 text-red-800 p-2 rounded" onClick={() => { setDisplay(String(memory)); setWaitingForNewValue(true); }}>MR</button>
        <button className="bg-blue-200 hover:bg-blue-300 text-blue-800 p-2 rounded" onClick={() => { setMemory(memory + parseFloat(display)); }}>M+</button>
        <button className="bg-blue-200 hover:bg-blue-300 text-blue-800 p-2 rounded" onClick={() => { setMemory(memory - parseFloat(display)); }}>M-</button>
        <button className="bg-orange-200 hover:bg-orange-300 text-orange-900 p-2 rounded font-bold" onClick={backspace}>&larr;</button>

        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(7)}>7</button>
        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(8)}>8</button>
        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(9)}>9</button>
        <button className="bg-orange-200 hover:bg-orange-300 text-orange-900 p-2 rounded font-bold" onClick={clearAll}>C</button>
        <button className="bg-orange-200 hover:bg-orange-300 text-orange-900 p-2 rounded font-bold" onClick={() => clearAll()}>CE</button>

        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(4)}>4</button>
        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(5)}>5</button>
        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(6)}>6</button>
        <button className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded font-bold" onClick={() => performOperation('*')}>×</button>
        <button className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded font-bold" onClick={() => performOperation('/')}>÷</button>

        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(1)}>1</button>
        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(2)}>2</button>
        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={() => inputDigit(3)}>3</button>
        <button className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded font-bold" onClick={() => performOperation('+')}>+</button>
        <button className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded font-bold" onClick={() => performOperation('-')}>-</button>

        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm col-span-2" onClick={() => inputDigit(0)}>0</button>
        <button className="bg-white hover:bg-gray-100 p-2 rounded font-bold shadow-sm" onClick={inputDot}>.</button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-bold col-span-2" onClick={() => performOperation('=')}>=</button>

      </div>
    </div>
  );
};

export default VirtualCalculator;
