import React from 'react';
import { downloadPayslip } from '../../services/api';

function EmployeeList({ employees, onDeleteEmployee, isAdmin }) {
  // Payslip PDF ဒေါင်းလုဒ်ဆွဲသည့် Function
  const handleDownloadPayslip = async (id, name) => {
    try {
      const response = await downloadPayslip(id);
      
      // Browser မှ တိုက်ရိုက် Download ဆွဲရန် Blob ဖန်တီးခြင်း
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Payslip ဒေါင်းလုဒ်ဆွဲရာတွင် အမှားအယွင်းရှိနေပါသည်။ (Backend Server အလုပ်လုပ်နေမနေ စစ်ဆေးပေးပါ)");
    }
  };

  const getDocumentFileName = (url) => {
    if (!url) return null;
    try {
      return decodeURIComponent(url.split('/').pop().split('?')[0]);
    } catch {
      return url.split('/').pop().split('?')[0];
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow mt-6">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
        ဝန်ထမ်းစာရင်း (Global Directory)
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="p-3">Avatar</th>
              <th className="p-3">Full Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Department</th>
              <th className="p-3">Type</th>
              <th className="p-3">Salary</th>
              <th className="p-3">Document</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {employees && employees.length > 0 ? (
              employees.map((emp) => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex justify-center items-center">
                      {emp.profile_picture_url || emp.profile_picture ? (
                        <img
                          src={emp.profile_picture_url || emp.profile_picture}
                          alt={`${emp.first_name} ${emp.last_name}`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                          style={{ width: '42px', height: '42px' }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold"
                          style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e1f5fe', color: '#01579b', fontWeight: '700', fontSize: '16px' }}
                        >
                          {emp.first_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-gray-900">
                    {emp.first_name} {emp.last_name}
                  </td>
                  <td className="p-3 text-gray-600">{emp.email}</td>
                  <td className="p-3">{emp.department_name || emp.department || 'N/A'}</td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-semibold">
                      {emp.employment_type || emp.type || 'full_time'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-gray-800">
                    ${Number(emp.salary).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    {emp.document_url || emp.document ? (
                      <a
                        href={emp.document_url || emp.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 text-sm font-medium transition inline-flex items-center gap-1"
                      >
                        📄 {getDocumentFileName(emp.document_url || emp.document)}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No Document</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center items-center gap-2">
                      {/* Payslip PDF ခလုတ် */}
                      <button
                        onClick={() => handleDownloadPayslip(emp.id, emp.first_name)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm font-medium transition"
                      >
                        Payslip PDF
                      </button>

                      {/* ⭐ Terminate ခလုတ် - Admin များသာ မြင်နိုင်သည် ⭐ */}
                      {isAdmin && onDeleteEmployee && (
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm font-medium transition"
                        >
                          Terminate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  ဝန်ထမ်း အချက်အလက် မရှိသေးပါ။
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeList;