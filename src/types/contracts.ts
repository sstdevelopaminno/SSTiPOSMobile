export type BranchRole="owner"|"manager"|"staff"|"accountant";
export type PosFeatureCode="core_pos_sales"|"pin_login"|"attendance_tracking"|"device_management"|"user_management"|"inet_nops_qr";
export type ApiError={code:string;message:string};
export type ApiResponse<T>={data:T;error:null}|{data:null;error:ApiError};
export type MobileScope={
  tenantId:string;
  branchId:string;
  userId:string;
  role:BranchRole;
  sessionId:string;
  deviceId:string;
  deviceCode:string;
  deviceName?:string|null;
};
