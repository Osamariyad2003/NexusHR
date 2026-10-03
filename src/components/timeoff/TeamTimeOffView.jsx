import React from 'react';
import { useApp } from '../../context/AppContext';
import TimeOffRequestsView from './TimeOffRequestsView';

/** Leave requests of the people I manage (HR sees everyone). */
export const TeamTimeOffView = () => {
  const { currentUser } = useApp();
  const isHr = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);
  return <TimeOffRequestsView title="Team Time Off" subtitle={isHr ? 'Everyone (you are an HR administrator)' : currentUser?.role === 'PEOPLE_MANAGER' ? `Your team: ${currentUser.department}` : 'Your own requests'} />;
};

export default TeamTimeOffView;
