"use client"
import { ICheckService, CheckService } from '@/lib/check-service';
import React, { createContext, useContext } from 'react';

const CheckServiceContext = createContext<ICheckService>(new CheckService());

export const CheckServiceProvider = ({ children }: { children: React.ReactNode }) => {
  const service = new CheckService();
  return (
    <CheckServiceContext.Provider value={service}>{children}</CheckServiceContext.Provider>
  );
};

export const useCheckService = () => useContext(CheckServiceContext);
