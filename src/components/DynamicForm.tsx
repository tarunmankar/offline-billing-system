import React from 'react';
import { Calendar, Hash, Tag, Edit3 } from 'lucide-react';

export interface CustomField {
  label: string;
  key: string;
  type?: 'text' | 'number' | 'date';
}

interface DynamicFormProps {
  fields: CustomField[];
  values: Record<string, string | number>;
  onChange: (key: string, value: string | number) => void;
  title?: string;
  description?: string;
}

const resolveFieldType = (key: string, label: string): 'text' | 'number' | 'date' => {
  const lowerKey = key.toLowerCase();
  const lowerLabel = label.toLowerCase();
  
  if (lowerKey.includes('date') || lowerKey.includes('expiry') || lowerLabel.includes('date')) return 'date';
  if (lowerKey.includes('price') || lowerKey.includes('qty') || lowerKey.includes('quantity') || lowerKey.includes('amount')) return 'number';
  
  return 'text';
};

const getIconForType = (type: string, key: string) => {
  if (type === 'date') return <Calendar size={18} className="text-blue-400" />;
  if (type === 'number') return <Hash size={18} className="text-emerald-400" />;
  if (key.toLowerCase().includes('batch') || key.toLowerCase().includes('code')) return <Tag size={18} className="text-purple-400" />;
  return <Edit3 size={18} className="text-slate-400" />;
};

const DynamicForm: React.FC<DynamicFormProps> = ({ fields, values, onChange, title, description }) => {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl w-full">
      {(title || description) && (
         <div className="mb-6 border-b border-slate-800/60 pb-4">
           {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
           {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => {
          const type = field.type || resolveFieldType(field.key, field.label);
          
          return (
            <div key={field.key} className="flex flex-col gap-2">
              <label htmlFor={field.key} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {field.label}
              </label>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                  {getIconForType(type, field.key)}
                </div>
                
                <input
                  id={field.key}
                  type={type}
                  value={values[field.key] || ''}
                  onChange={(e) => onChange(field.key, type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={`Enter ${field.label}...`}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block pl-10 p-2.5 transition-all shadow-inner"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicForm;
