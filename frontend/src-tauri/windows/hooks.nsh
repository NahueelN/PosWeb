; Limpieza de la instalacion legacy "PosWeb" (renombre PosWeb -> Vendeto).
; PosWeb 1.1.x y Vendeto comparten identifier (com.posweb.app) y datos (KIO),
; pero el instalador NSIS instala en %LOCALAPPDATA%\<productName> y registra la
; desinstalacion bajo el nombre del producto. Al renombrar el producto, el
; upgrade dejaba atras la carpeta, los accesos directos y la entrada de
; desinstalacion de PosWeb: el acceso directo viejo volvia a descargar el
; update en cada apertura (loop). Este hook limpia esa instalacion legacy.

!macro NSIS_HOOK_PREINSTALL
  DetailPrint "Vendeto: limpiando instalacion legacy PosWeb..."

  ; Carpeta de la instalacion per-user legacy (borra al reiniciar si esta en uso)
  IfFileExists "$LOCALAPPDATA\PosWeb\app.exe" 0 posweb_cleanup_folder_done
  RMDir /r /REBOOTOK "$LOCALAPPDATA\PosWeb"
  posweb_cleanup_folder_done:

  ; Accesos directos legacy
  Delete "$SMPROGRAMS\PosWeb.lnk"
  Delete "$DESKTOP\PosWeb.lnk"

  ; Entrada de desinstalacion legacy (per-user y per-machine)
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PosWeb"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PosWeb"
!macroend

; El update via updater no recrea el acceso directo del producto nuevo (y el hook
; PREINSTALL borra el de PosWeb). Este hook garantiza que siempre exista el acceso
; directo de Vendeto en el menu Inicio para que la app aparezca en la busqueda.
!macro NSIS_HOOK_POSTINSTALL
  CreateShortcut "$SMPROGRAMS\Vendeto.lnk" "$INSTDIR\app.exe"
!macroend