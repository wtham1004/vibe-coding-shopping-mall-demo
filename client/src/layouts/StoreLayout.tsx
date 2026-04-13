import { Outlet } from 'react-router-dom'
import MainNavbar from '@/components/MainNavbar'

export default function StoreLayout() {
  return (
    <>
      <MainNavbar />
      <Outlet />
    </>
  )
}
