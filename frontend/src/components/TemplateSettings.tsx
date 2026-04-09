'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Edit3, Check, X, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  default_value: string;
  is_table: boolean;
}

interface Template {
  id: string;
  name: string;
  html_content: string;
  variables: TemplateVariable[];
  created_at: string;
}

// Default API URL - should ideally come from config/env
const API_BASE_URL = 'http://localhost:5052';

export function TemplateSettings() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/templates/`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Could not load templates', {
        description: 'Ensure the backend is running at ' + API_BASE_URL
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      toast.error('Invalid file type', { description: 'Please upload an .html or .htm file' });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, ""));

    try {
      const response = await fetch(`${API_BASE_URL}/templates/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const newTemplate = await response.json();
      toast.success('Template uploaded successfully');
      fetchTemplates();
      setSelectedTemplate(newTemplate);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', { description: 'Check backend connection' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      toast.success('Template deleted');
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  const updateVariable = async (templateId: string, varId: string, description: string, defaultValue: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/variables/${varId}?description=${encodeURIComponent(description)}&default_value=${encodeURIComponent(defaultValue)}`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Update failed');
      toast.success('Variable updated');
      // Refresh selected template detail
      const detailResp = await fetch(`${API_BASE_URL}/templates/${templateId}`);
      if (detailResp.ok) {
        const updatedTemplate = await detailResp.json();
        setSelectedTemplate(updatedTemplate);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update variable');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
      {/* List Area */}
      <div className="md:col-span-1 flex flex-col h-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="flex flex-row items-center justify-between p-4 pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
          <div className="relative">
            <input
              type="file"
              id="template-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Label
              htmlFor="template-upload"
              className={`p-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 flex items-center gap-2 text-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Plus className="w-4 h-4" />
              Upload
            </Label>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {templates.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No templates yet.
                </div>
              )}
              {templates.map((t: Template) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                    selectedTemplate?.id === t.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className={`w-4 h-4 ${selectedTemplate?.id === t.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium truncate">{t.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    onClick={(e) => handleDeleteTemplate(t.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Detail Area */}
      <div className="md:col-span-2 flex flex-col h-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedTemplate ? `Settings: ${selectedTemplate.name}` : 'Select a template'}
          </h3>
        </div>
        <div className="flex-1 overflow-hidden p-0 bg-gray-50">
          {selectedTemplate ? (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Detected Variables</h4>
                  {selectedTemplate.variables.length === 0 ? (
                    <div className="text-sm text-gray-500">No variables found in this template.</div>
                  ) : (
                    <div className="grid gap-4">
                      {selectedTemplate.variables.map((v: TemplateVariable) => (
                        <VariableItem 
                          key={v.id} 
                          variable={v} 
                          onSave={(desc: string, def: string) => updateVariable(selectedTemplate.id, v.id, desc, def)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Upload className="w-12 h-12 mb-4 opacity-20" />
              <p>Upload a new HTML template or select one from the list to configure its variables.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VariableItem({ 
  variable, 
  onSave 
}: { 
  variable: TemplateVariable; 
  onSave: (desc: string, def: string) => void | Promise<void>;
  key?: React.Key;
}) {
  const [desc, setDesc] = useState(variable.description || '');
  const [def, setDef] = useState(variable.default_value || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setDesc(variable.description || '');
    setDef(variable.default_value || '');
  }, [variable]);

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <code className="px-2 py-1 bg-gray-100 rounded text-blue-700 font-bold text-xs">
              §#{variable.name}#§
            </code>
            {variable.is_table && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">
                Table
              </span>
            )}
          </div>
          {!isEditing ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-3 h-3 text-gray-400" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => {
                onSave(desc, def);
                setIsEditing(false);
              }}>
                <Check className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setIsEditing(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-500 uppercase">Description</Label>
            {isEditing ? (
              <Input 
                value={desc} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)} 
                className="h-8 text-sm" 
                placeholder="What is this for?"
              />
            ) : (
              <div className="text-sm text-gray-700 truncate min-h-[1.25rem]">
                {variable.description || <span className="text-gray-300 italic">No description</span>}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-500 uppercase">Default Value</Label>
            {isEditing ? (
              <Input 
                value={def} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDef(e.target.value)} 
                className="h-8 text-sm"
                placeholder="Standard fallback"
              />
            ) : (
              <div className="text-sm text-gray-700 truncate min-h-[1.25rem]">
                {variable.default_value || <span className="text-gray-300 italic">No default</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
