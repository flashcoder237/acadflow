// src/components/layout/AppLayout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '../ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'

export const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 pt-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}



