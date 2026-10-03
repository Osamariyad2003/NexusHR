import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PayrollListView } from './PayrollListView';
import { PayrollRunView } from './PayrollRunView';
import { EmployeePayslips } from './EmployeePayslips';

export const PayrollManagerView = () => {
  const { currentUser } = useApp();
  const [selectedRun, setSelectedRun] = useState(null);
  // Bumped after approve/delete so the list reloads when shown again
  const [version, setVersion] = useState(0);

  // Running payroll is HR-only; everyone else sees their own payslips here (header "Payslip" link)
  if (!['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role)) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Payslips</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Your approved payslips. Open one to print it or save it as PDF.</p>
        </div>
        <EmployeePayslips employeeId={currentUser.id} />
      </div>
    );
  }

  if (selectedRun) {
    return (
      <PayrollRunView
        run={selectedRun}
        onBack={() => setSelectedRun(null)}
        onChanged={() => setVersion((v) => v + 1)}
      />
    );
  }

  return <PayrollListView key={version} onSelectRun={setSelectedRun} />;
};
