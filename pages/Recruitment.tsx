import React, { useState } from 'react';
import { FileText, Printer, CheckCircle, Download } from 'lucide-react';

const Recruitment: React.FC = () => {
    const [formData, setFormData] = useState({
        candidateName: '',
        role: '',
        department: 'Engineering',
        manager: '',
        startDate: '',
        salary: '',
        location: 'Bangalore, India'
    });

    const [showPreview, setShowPreview] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsAccepted(false);
        setShowPreview(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    Recruitment & Offer Letters
                </h1>
                <p className="text-slate-500">Generate and manage candidate offer letters</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold mb-4 text-slate-700">Candidate Details</h2>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Name</label>
                                <input
                                    type="text"
                                    name="candidateName"
                                    required
                                    value={formData.candidateName}
                                    onChange={handleInputChange}
                                    className="w-full border p-2 rounded-lg"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Designation</label>
                                <input
                                    type="text"
                                    name="role"
                                    required
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full border p-2 rounded-lg"
                                    placeholder="e.g. Senior Developer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="w-full border p-2 rounded-lg"
                                >
                                    <option value="Engineering">Engineering</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="HR">HR</option>
                                    <option value="Product">Product</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reporting Manager</label>
                                <input
                                    type="text"
                                    name="manager"
                                    required
                                    value={formData.manager}
                                    onChange={handleInputChange}
                                    className="w-full border p-2 rounded-lg"
                                    placeholder="e.g. Jane Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    required
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="w-full border p-2 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Annual CTC (INR)</label>
                                <input
                                    type="text"
                                    name="salary"
                                    required
                                    value={formData.salary}
                                    onChange={handleInputChange}
                                    className="w-full border p-2 rounded-lg"
                                    placeholder="e.g. 1,200,000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Work Location</label>
                            <input
                                type="text"
                                name="location"
                                required
                                value={formData.location}
                                onChange={handleInputChange}
                                className="w-full border p-2 rounded-lg"
                                placeholder="e.g. Bangalore, India"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FileText size={20} />
                                Generate Offer Letter
                            </button>
                        </div>
                    </form>
                </div>

                {/* Instructions / Recent */}
                <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
                        <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                            <li>Fill in all candidate details accurately.</li>
                            <li>Click <strong>Generate Offer Letter</strong> to preview.</li>
                            <li>Review the letter carefully in the preview modal.</li>
                            <li>Use the <strong>Print/Save as PDF</strong> button to download the official letter.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
                    <div className="bg-white w-full max-w-4xl h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none">

                        {/* Modal Header - Hidden on Print */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 print:hidden bg-slate-50 rounded-t-2xl">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                Offer Letter Preview
                            </h3>
                            <div className="flex gap-3">
                                {!isAccepted && (
                                    <button
                                        onClick={() => setIsAccepted(true)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 transition-colors"
                                    >
                                        <CheckCircle size={18} />
                                        Accept Offer
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                >
                                    <Printer size={18} />
                                    Print / Save PDF
                                </button>
                            </div>
                        </div>

                        {/* Letter Content - Printable Area */}
                        <div className="p-12 md:p-16 text-slate-900 print:p-0 relative">
                            {isAccepted && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-8 border-green-600 text-green-600 px-8 py-2 text-6xl font-black opacity-20 rotate-[-15deg] pointer-events-none select-none z-0">
                                    ACCEPTED
                                </div>
                            )}

                            {/* Letterhead */}
                            <div className="flex items-center justify-between mb-12 border-b-2 border-slate-900 pb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center print:bg-blue-600 print-color-adjust">
                                        <CheckCircle className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight">Nexus Systems Inc.</h1>
                                        <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Enterprise Management Solutions</p>
                                    </div>
                                </div>
                                <div className="text-right text-sm text-slate-500">
                                    <p>Tech Park, Sector 5</p>
                                    <p>Bangalore, KA 560100</p>
                                    <p>www.nexus-systems.com</p>
                                </div>
                            </div>

                            {/* Date and Recipient */}
                            <div className="mb-8 relative z-10">
                                <p className="font-medium mb-6">{currentDate}</p>
                                <p className="font-bold text-lg">{formData.candidateName}</p>
                                <p className="text-slate-600">Candidate</p>
                            </div>

                            {/* Body */}
                            <div className="space-y-4 leading-relaxed text-justify relative z-10">
                                <p className="mb-4">
                                    Dear <strong>{formData.candidateName}</strong>,
                                </p>
                                <p>
                                    We are pleased to offer you the position of <strong>{formData.role}</strong> at Nexus Systems Inc.
                                    We were impressed with your skills and experience and believe you will be a valuable asset to our
                                    <strong> {formData.department}</strong> team.
                                </p>
                                <p>
                                    Your annual Cost to Company (CTC) will be <strong>INR {formData.salary}</strong>.
                                    You will be reporting to <strong>{formData.manager}</strong>.
                                </p>
                                <p>
                                    Your joining date is confirmed for <strong>{new Date(formData.startDate).toLocaleDateString('en-US', { dateStyle: 'long' })}</strong> at our <strong>{formData.location}</strong> office.
                                    Please report to the HR desk at 9:30 AM on your first day for orientation.
                                </p>
                                <p>
                                    We look forward to welcoming you to the Nexus family and working together to achieve great things.
                                </p>
                            </div>

                            {/* Signature */}
                            <div className="mt-16 grid grid-cols-2 gap-12 relative z-10">
                                <div>
                                    <div className="border-t border-slate-300 pt-2 w-48">
                                        <p className="font-bold">Human Resources</p>
                                        <p className="text-sm text-slate-500">Nexus Systems Inc.</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="border-t border-slate-300 pt-2 w-48">
                                        <p className="font-bold flex items-center gap-2">
                                            {formData.candidateName}
                                            {isAccepted && <CheckCircle size={16} className="text-green-600" />}
                                        </p>
                                        <p className="text-sm text-slate-500">Candidate Acceptance</p>
                                        {isAccepted && (
                                            <p className="text-xs text-green-600 mt-1 font-medium bg-green-50 inline-block px-2 py-0.5 rounded">
                                                By: {formData.candidateName} on {new Date().toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-20 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                                <p>This document is electronically generated and is valid without a physical signature.</p>
                                <p>Nexus Systems Inc. | Confidential Offer Letter</p>
                            </div>

                        </div>

                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed, .fixed * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white;
            padding: 0;
          }
           /* Hide scrollbars and buttons in print */
          button {
             display: none !important;
          }
        }
      `}</style>
        </div>
    );
};

export default Recruitment;
