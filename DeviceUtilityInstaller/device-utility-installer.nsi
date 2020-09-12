;NSIS Modern User Interface
;Basic Example Script
;Written by Joost Verburg

;--------------------------------
;Include Modern UI

  !addincludedir "include"
  !addincludedir "Pages"

  !include "MUI2.nsh"
  !include "LogicLib.nsh"
  !include "WinMessages.nsh"
  !include "VersionCompare.nsh"
  !include "Trim.nsh"
  !include "StrRep.nsh"
  ; !include "ReadFile.nsh"
  !include "PowerShell.nsh"
  !include "ConfigRead.nsh"
  !include "HandleError.nsh"
  
;--------------------------------
;Custom Include
  !include "onInit.nsi"
  !include "signInstaller.nsi"
;--------------------------------
;Declare variables
;--------------------------------
;General

  ;Name and file
  Name "Device Utility Installer"
  OutFile "DeviceUtility.setup.exe"

  ;Default installation folder
  InstallDir "$PROGRAMFILES\DeviceUtility"
  
  ;Get installation folder from registry if available
  InstallDirRegKey HKCU "Software\DeviceUtility" "$PROGRAMFILES\DeviceUtility"

  ;Request application privileges for Windows Vista
  RequestExecutionLevel admin

;--------------------------------
;Interface Settings

  ; !define MUI_ABORTWARNING
  !define MUI_ICON "images\data.ico"
  !define MUI_WELCOMEPAGE_TEXT "${WELCOME_TEXT}"
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_BITMAP "images\fmcLogo.bmp"
  !define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
  
;--------------------------------
;Pages
  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "config\license.txt"
  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES

  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  
;--------------------------------
;Languages
 
  !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections

Section "Clone App" Installation
  InitPluginsDir
  SetOutPath $PLUGINSDIR\Powershell
  File set-local-service.ps1

  SetOutPath "$INSTDIR"
  DetailPrint "Setting permission for application folder to Local service account."
  ${PowerShellExecFileLog} '$PLUGINSDIR\Powershell\set-local-service.ps1'
  Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while setting permission to folder. Please contact support team for help."

  ;ADD YOUR OWN FILES HERE...
  DetailPrint "Git init the Device Utility folder..."
  nsExec::ExecToLog 'git init'
	Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while initializing git in the folder. Please contact support team for help."
  
  DetailPrint "Adding remote origin to the git remote..."
  nsExec::ExecToLog 'git remote add origin https://YE260663:Penchalaia@bitbucket.org/fmcnaunity/fmc-na_unity.git'
	Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while add git origin in the folder. Please contact support team for help."
  
  DetailPrint "Pulling code from git repository..."
  nsExec::ExecToLog 'git pull origin DeviceUtility_Build'
	Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while pulling code from git repository. Please contact support team for help."
  
  DetailPrint "Setting up app.config.json"
  nsJSON::Set /file "$INSTDIR/app.config.json"
  ${StrRep} $1 $INSTDIR "\" "/"
  nsJSON::Set "logFilePath" /value '"$1/log"'
  nsJSON::Serialize /format /file "$INSTDIR/app.config.json"

  SetOutPath $PLUGINSDIR
  File "${__FILEDIR__}\commands\npm-install.bat"
  SetOutPath "$INSTDIR"
  DetailPrint "Installing node modules..."
  nsExec::ExecToLog '"$PLUGINSDIR\npm-install.bat"'
	Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while installing node modules. Please contact support team for help."

  SetOutPath "$INSTDIR"
  DetailPrint "Installing windows service..."
  nsExec::ExecToLog "node windows-service-installer.js"
  Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while installing Device Utility service. Please contact support team for help."

  SetOutPath $PLUGINSDIR\Powershell
  File folder-access.ps1
  SetOutPath "$INSTDIR"
  DetailPrint "Setting permission for application folder and node to Local service account."
  ${PowerShellExecFileLog} '$PLUGINSDIR\Powershell\folder-access.ps1'
  Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while setting permission to folder. Please contact support team for help."

  SetOutPath "$INSTDIR"
  DetailPrint "Installing windows service..."
  nsExec::ExecToLog "node windows-service-installer.js"
  Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while installing Device Utility service. Please contact support team for help."

  SetOutPath $PLUGINSDIR\Powershell
  File revoke-folder-access.ps1
  
  SetOutPath "$INSTDIR"
  DetailPrint "Revoking access to restricted folder to all users except Local Service account"
  ${PowerShellExecFileLog} "$PLUGINSDIR\Powershell\revoke-folder-access.ps1"
  Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while revoking access to restricted folder. Please contact support team for help."

  ;Store installation folder
  WriteRegStr HKCU "Software\Device_Utility" "InstalledDirectory" $INSTDIR
  
  ;Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd


Section "Uninstall"
  InitPluginsDir
  DetailPrint "Remove access contraint from restricted folder for uninstallation"
  nsExec::ExecToLog 'ICACLS "$INSTDIR\restricted" /T /Q /C /RESET'
  Pop $0 # return value/error/timeout
  ${HandleError} $0 "Error while removing access contraint from restricted folder. Please contact support team for help."

  ;ADD YOUR OWN FILES HERE...
  SetOutPath "$INSTDIR"
  DetailPrint "Stoping windows service..."
  nsExec::ExecToLog "node stop-service.js"
  Pop $0 # return value/error/timeout
  ; ${HandleError} $0 "Error while uninstalling Device Utility service. Please contact support team for help."

  SetOutPath "$INSTDIR"
  DetailPrint "Removing installed files..."
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"

  SetOutPath $PLUGINSDIR
  File "${__FILEDIR__}\commands\delete-folder.bat"
  SetOutPath "$INSTDIR"
  DetailPrint "Removing installed files using command rmdir /s /q for long paths in node_modules folder..."
  nsExec::ExecToLog '"$PLUGINSDIR\delete-folder.bat"'
  Pop $0 # return value/error/timeout
  
  SetOutPath $PLUGINSDIR
  DetailPrint "Deleting main folder..."
  RMDir /r "$INSTDIR"

  DeleteRegKey /ifempty HKCU "Software\Device_Utility"

SectionEnd