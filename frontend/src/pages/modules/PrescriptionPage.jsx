import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    X
} from 'lucide-react';

import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const PrescriptionPage = () => {
    const { user } = useAuth();

    const [doctorName, setDoctorName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        setSuccessMessage('');
        setErrorMessage('');

        if (!file) {
            return;
        }

        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg'
        ];

        const maxSize = 10 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            setErrorMessage(
                'Invalid file type. Please select a PDF or JPEG file.'
            );
            return;
        }

        if (file.size > maxSize) {
            setErrorMessage(
                'File is too large. Maximum allowed size is 10 MB.'
            );
            return;
        }

        setSelectedFile(file);
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setErrorMessage('');
        setSuccessMessage('');

        const fileInput = document.getElementById('prescription-file');

        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setSuccessMessage('');
        setErrorMessage('');

        if (!user) {
            setErrorMessage(
                'You must be logged in to upload a prescription.'
            );
            return;
        }

        if (!doctorName.trim()) {
            setErrorMessage('Please enter the doctor name.');
            return;
        }

        if (!selectedFile) {
            setErrorMessage('Please select a prescription file.');
            return;
        }

        const customerId = user.userId ?? user.id;

        if (!customerId) {
            setErrorMessage(
                'Unable to identify the logged-in customer.'
            );
            return;
        }

        const formData = new FormData();

        formData.append('file', selectedFile);
        formData.append('doctorName', doctorName.trim());
        formData.append('customerId', customerId);

        try {
            setUploading(true);

            const response = await client.post(
                '/api/v1/prescriptions/upload',
                formData
            );

            const prescription = response.data;

            setSuccessMessage(
                `Prescription uploaded successfully. Prescription ID: ${prescription.id}`
            );

            setDoctorName('');
            setSelectedFile(null);

            const fileInput = document.getElementById(
                'prescription-file'
            );

            if (fileInput) {
                fileInput.value = '';
            }

        } catch (error) {
            console.error('Prescription upload failed:', error);

            const backendMessage =
                error.response?.data;

            setErrorMessage(
                typeof backendMessage === 'string'
                    ? backendMessage
                    : 'Prescription upload failed. Please try again.'
            );

        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">

            {/* Header */}
            <div className="mb-8">
                <Link
                    to="/"
                    className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-5"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                <h1 className="text-3xl font-bold text-gray-900">
                    Prescription Management
                </h1>

                <p className="mt-2 text-gray-600">
                    Upload your prescription for pharmacist verification.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Information */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

                        <div className="flex items-center mb-4">
                            <FileText className="w-6 h-6 text-teal-600 mr-3" />

                            <h2 className="text-lg font-semibold text-gray-900">
                                Prescription Upload
                            </h2>
                        </div>

                        <p className="text-sm text-gray-600 mb-5">
                            Upload a clear copy of your valid prescription.
                            A pharmacist will review it before medicines can
                            be ordered.
                        </p>

                        <div className="space-y-3 text-sm text-gray-600">
                            <div>
                                <strong>Accepted:</strong> PDF, JPEG
                            </div>

                            <div>
                                <strong>Maximum size:</strong> 10 MB
                            </div>

                            <div>
                                <strong>Status after upload:</strong> Pending
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

                        <form onSubmit={handleSubmit}>

                            {/* Doctor Name */}
                            <div className="mb-6">
                                <label
                                    htmlFor="doctor-name"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Doctor Name
                                </label>

                                <input
                                    id="doctor-name"
                                    type="text"
                                    value={doctorName}
                                    onChange={(event) =>
                                        setDoctorName(event.target.value)
                                    }
                                    placeholder="Enter doctor's name"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* File Upload */}
                            <div className="mb-6">

                                <label
                                    htmlFor="prescription-file"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Prescription File
                                </label>

                                <label
                                    htmlFor="prescription-file"
                                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-teal-500 hover:bg-gray-50 transition"
                                >
                                    <Upload className="w-10 h-10 text-teal-600 mb-3" />

                                    <span className="text-sm font-medium text-gray-800">
                    Click to select your prescription
                  </span>

                                    <span className="text-xs text-gray-500 mt-2">
                    PDF or JPEG • Maximum 10 MB
                  </span>

                                    <input
                                        id="prescription-file"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Selected File */}
                            {selectedFile && (
                                <div className="mb-6 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">

                                    <div className="flex items-center min-w-0">
                                        <FileText className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0" />

                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {selectedFile.name}
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={removeSelectedFile}
                                        className="ml-4 text-gray-500 hover:text-red-600"
                                        title="Remove file"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Error */}
                            {errorMessage && (
                                <div className="mb-6 flex items-start bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">

                                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />

                                    <p className="text-sm">
                                        {errorMessage}
                                    </p>
                                </div>
                            )}

                            {/* Success */}
                            {successMessage && (
                                <div className="mb-6 flex items-start bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">

                                    <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />

                                    <p className="text-sm">
                                        {successMessage}
                                    </p>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition"
                            >
                                {uploading
                                    ? 'Uploading...'
                                    : 'Upload Prescription'}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionPage;