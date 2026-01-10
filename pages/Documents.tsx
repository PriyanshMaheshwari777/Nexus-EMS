import React, { useState, useEffect } from 'react';
import { FileText, Download, Folder, Upload, Search, X } from 'lucide-react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  folder?: string;
}

const Documents: React.FC = () => {
  const [folders, setFolders] = useState([
    { id: 1, name: "HR Policies", files: 0 },
    { id: 2, name: "Employee Handbooks", files: 0 },
    { id: 3, name: "Training Materials", files: 0 },
    { id: 4, name: "Contracts & Agreements", files: 0 },
  ]);

  const [recentFiles, setRecentFiles] = useState<Document[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeFolderFilter, setActiveFolderFilter] = useState<string | null>(null);

  const { containerRef: foldersRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-folder]',
    axis: 'both',
    columns: 4 // MD screen has 4 columns
  });

  const { containerRef: filesRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-file]',
    axis: 'vertical'
  });

  useEffect(() => {
    // Update folder file counts based on actual files
    const updatedFolders = folders.map(folder => {
      const count = recentFiles.filter(f => f.folder === folder.name).length;
      return { ...folder, files: count };
    });
    setFolders(updatedFolders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentFiles]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredFiles = recentFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All Types' || file.type === filterType;
    const matchesFolder = !activeFolderFilter || file.folder === activeFolderFilter;
    return matchesSearch && matchesType && matchesFolder;
  });

  const handleDownload = (file: Document) => {
    // Create a dummy file content
    const content = `This is a sample ${file.type} file: ${file.name}\n\nGenerated on ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`Downloaded: ${file.name}`);
  };

  const handleFolderClick = (folderId: number) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      if (activeFolderFilter === folder.name) {
        // If already filtered, clear filter
        setActiveFolderFilter(null);
      } else {
        // Filter by folder
        setActiveFolderFilter(folder.name);
      }
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    const newFile: Document = {
      id: recentFiles.length + 1,
      name: uploadFile.name,
      type: uploadFile.name.split('.').pop()?.toUpperCase() || 'FILE',
      size: `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      folder: selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : undefined
    };

    setRecentFiles([newFile, ...recentFiles]);

    // Update folder count
    if (selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder);
      if (folder) {
        const updatedFolders = folders.map(f =>
          f.id === selectedFolder ? { ...f, files: f.files + 1 } : f
        );
        setFolders(updatedFolders);
      }
    }

    setShowUploadModal(false);
    setUploadFile(null);
    setSelectedFolder(null);
    alert(`File "${uploadFile.name}" uploaded successfully!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
          <p className="text-slate-500">Centralized document repository</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center"
        >
          <Upload size={18} className="mr-2" /> Upload Document
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 focus:outline-none"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option>All Types</option>
          <option>PDF</option>
          <option>Excel</option>
          <option>Word</option>
          <option>PPT</option>
        </select>
      </div>

      {/* Folders */}
      <div ref={foldersRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {folders.map(folder => (
          <div
            key={folder.id}
            data-nav-folder
            tabIndex={0}
            onClick={() => handleFolderClick(folder.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFolderClick(folder.id);
            }}
            className={`p-6 rounded-xl border cursor-pointer transition-colors group outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeFolderFilter === folder.name
              ? 'bg-blue-600 border-blue-700 text-white'
              : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
              }`}
          >
            <Folder size={32} className={`mb-3 group-hover:scale-110 transition-transform ${activeFolderFilter === folder.name ? 'text-white' : 'text-blue-500'
              }`} />
            <h3 className={`font-semibold ${activeFolderFilter === folder.name ? 'text-white' : 'text-slate-800'}`}>
              {folder.name}
              {activeFolderFilter === folder.name && ' (Active)'}
            </h3>
            <p className={`text-xs mt-1 ${activeFolderFilter === folder.name ? 'text-blue-100' : 'text-slate-500'}`}>
              {folder.files} files
            </p>
          </div>
        ))}
        {activeFolderFilter && (
          <div className="col-span-full flex justify-end">
            <button
              onClick={() => setActiveFolderFilter(null)}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Recent Files */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">
            {activeFolderFilter ? `Files in ${activeFolderFilter}` : 'Recent Files'}
          </h3>
          {activeFolderFilter && (
            <button
              onClick={() => setActiveFolderFilter(null)}
              className="text-sm text-blue-600 hover:underline"
            >
              Show All
            </button>
          )}
        </div>
        <div ref={filesRef} className="divide-y divide-slate-100">
          {recentFiles.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 font-medium">No documents uploaded yet</p>
              <p className="text-sm text-slate-400 mt-2">Click "Upload Document" to add your first document</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No documents found matching your search.
            </div>
          ) : (
            filteredFiles.map(file => (
              <div
                key={file.id}
                data-nav-file
                tabIndex={0}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${file.type === 'PDF' ? 'bg-red-100 text-red-600' :
                    file.type === 'Excel' ? 'bg-emerald-100 text-emerald-600' :
                      file.type === 'PPT' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{file.size} • {file.date} {file.folder && `• ${file.folder}`}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download"
                  tabIndex={-1} // Stay within container focus
                >
                  <Download size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Folder (Optional)</label>
                <select
                  className="w-full border border-slate-200 rounded-lg p-2"
                  value={selectedFolder || ''}
                  onChange={(e) => setSelectedFolder(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">No Folder</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select File</label>
                <input
                  type="file"
                  className="w-full border border-slate-200 rounded-lg p-2"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile && (
                  <p className="text-xs text-slate-500 mt-1">Selected: {uploadFile.name}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
