"use client"

import {
  ShoppingCart,
  ShoppingBag,
  Receipt,
  CreditCard,
  ClipboardList,
  Wallet,
  Settings,
  UserPlus,
  BarChart2,
  Users,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

type NavItem = {
  label: string
  icon: React.ReactNode
  active?: boolean
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Operaciones",
    items: [
      { label: "Ventas",    icon: <ShoppingCart  size={14} strokeWidth={2} />, active: true },
      { label: "Compras",   icon: <ShoppingBag   size={14} strokeWidth={2} /> },
      { label: "Gastos",    icon: <Receipt       size={14} strokeWidth={2} /> },
      { label: "Deudas",    icon: <CreditCard    size={14} strokeWidth={2} /> },
      { label: "Pedidos",   icon: <ClipboardList size={14} strokeWidth={2} /> },
      { label: "Caja",      icon: <Wallet        size={14} strokeWidth={2} /> },
    ],
  },
  {
    title: "Gestión",
    items: [
      { label: "Reportes",  icon: <BarChart2 size={14} strokeWidth={2} /> },
    ],
  },
  {
    title: "Personas",
    items: [
      { label: "Clientes",  icon: <Users size={14} strokeWidth={2} /> },
    ],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (title: string) =>
    setCollapsed((p) => ({ ...p, [title]: !p[title] }))

  return (
    <aside
      className="flex h-screen w-[196px] flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground"
      style={{ borderRight: "1px solid var(--sidebar-border)" }}
      aria-label="Navegación principal"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border flex-shrink-0">
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-[12px] tracking-tight select-none"
          style={{ boxShadow: "0 1px 4px oklch(0.52 0.255 278 / 0.35)" }}
        >
          PW
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13.5px] font-bold text-sidebar-accent-foreground tracking-tight">
            PosWeb
          </span>
          <span className="text-[9.5px] text-sidebar-foreground/35 font-medium mt-[3px] tracking-wide uppercase">
            v0.1
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-px" aria-label="Secciones">
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.title]
          return (
            <div key={group.title} className="mb-0.5">
              {/* Group label — collapsible */}
              <button
                className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-sidebar-accent/40 transition-colors group"
                onClick={() => toggle(group.title)}
                aria-expanded={!isCollapsed}
              >
                <span className="text-[9.5px] font-bold tracking-[0.11em] uppercase text-sidebar-foreground/35 group-hover:text-sidebar-foreground/55 transition-colors">
                  {group.title}
                </span>
                <ChevronDown
                  size={10}
                  strokeWidth={2.5}
                  className={cn(
                    "text-sidebar-foreground/25 transition-transform duration-200",
                    isCollapsed && "-rotate-90"
                  )}
                />
              </button>

              {/* Nav items */}
              {!isCollapsed && (
                <ul className="mt-px space-y-px">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href="#"
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-[7px]",
                          "text-[12.5px] font-medium transition-all duration-100",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-inset",
                          item.active
                            ? "bg-primary text-primary-foreground shadow-[0_1px_4px_oklch(0.52_0.255_278_/_0.30)]"
                            : [
                                "text-sidebar-foreground/60",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              ].join(" ")
                        )}
                        aria-current={item.active ? "page" : undefined}
                      >
                        <span className={cn(
                          "flex-shrink-0",
                          item.active ? "text-primary-foreground" : "text-sidebar-foreground/35"
                        )}>
                          {item.icon}
                        </span>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Bottom actions ── */}
      <div className="border-t border-sidebar-border px-2 py-2.5 space-y-px flex-shrink-0">
        <a
          href="#"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-[7px]",
            "text-[12px] font-medium text-sidebar-foreground/50",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-inset"
          )}
        >
          <UserPlus size={13} strokeWidth={2} className="flex-shrink-0 text-sidebar-foreground/30" />
          Alta usuario
        </a>
        <a
          href="#"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-[7px]",
            "text-[12px] font-medium text-sidebar-foreground/50",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-inset"
          )}
        >
          <Settings size={13} strokeWidth={2} className="flex-shrink-0 text-sidebar-foreground/30" />
          Configuración
        </a>
      </div>
    </aside>
  )
}
