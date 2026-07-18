import { useState, useCallback } from 'react'
import {
  loadDashboardConfig,
  saveDashboardConfig,
  createDefaultConfig,
  type DashboardConfig,
  type WidgetUserConfig,
} from './DashboardConfig'

export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(() => loadDashboardConfig())

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetUserConfig>) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        widgets: {
          ...prev.widgets,
          [widgetId]: {
            ...prev.widgets[widgetId],
            ...updates,
          },
        },
      }
      saveDashboardConfig(next)
      return next
    })
  }, [])

  const toggleWidget = useCallback((widgetId: string) => {
    setConfig((prev) => {
      const current = prev.widgets[widgetId]
      if (!current) return prev
      const next = {
        ...prev,
        widgets: {
          ...prev.widgets,
          [widgetId]: { ...current, enabled: !current.enabled },
        },
      }
      saveDashboardConfig(next)
      return next
    })
  }, [])

  const setWidgetOrder = useCallback((widgetId: string, order: number) => {
    setConfig((prev) => {
      const current = prev.widgets[widgetId]
      if (!current) return prev
      const next = {
        ...prev,
        widgets: {
          ...prev.widgets,
          [widgetId]: { ...current, order },
        },
      }
      saveDashboardConfig(next)
      return next
    })
  }, [])

  const updateWidgetSetting = useCallback((widgetId: string, key: string, value: any) => {
    setConfig((prev) => {
      const current = prev.widgets[widgetId]
      if (!current) return prev
      const next = {
        ...prev,
        widgets: {
          ...prev.widgets,
          [widgetId]: {
            ...current,
            settings: { ...current.settings, [key]: value },
          },
        },
      }
      saveDashboardConfig(next)
      return next
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    const defaults = createDefaultConfig()
    saveDashboardConfig(defaults)
    setConfig(defaults)
  }, [])

  return {
    config,
    updateWidget,
    toggleWidget,
    setWidgetOrder,
    updateWidgetSetting,
    resetToDefaults,
  }
}
