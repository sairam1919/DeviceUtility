ReserveFile /plugin InstallOptions.dll
;--------------------------------
;Declare variables
  !define /file WELCOME_TEXT "config\welcome.txt"
  Var nodeTargetVersion
  Var gitTargetVersion

;--------------------------------
;Version check Macro
!define VersionCheck "!insertmacro VersionCheck"
 
!macro VersionCheck app cVersion targetVersion
  ${VersionCompare} "${cVersion}" "${targetVersion}" $R0
  ${If} $R0 == 2
    MessageBox MB_OK|MB_ICONSTOP  "Please upgrade ${app} from v${cVersion} to v${targetVersion}.$\n"
    Abort "Install failed"
  ${EndIf}
!macroend

;--------------------------------
;Version check Macro
!define CommandErrorVersion "!insertmacro CommandErrorVersion"
 
!macro CommandErrorVersion app response version targetVersion
  ${If} "${response}" == "error"
    MessageBox MB_OK|MB_ICONSTOP "${app} is not installed. Please install ${app} v${targetVersion}.$\n"
    Abort "Install failed"
  ${ElseIf} "${response}" != "0"
    MessageBox MB_OK|MB_ICONSTOP  "${app} is not installed. Please install ${app} v${targetVersion}.$\n"
    Abort "Install failed"
  ${EndIf}
!macroend

;--------------------------------
;Intialization
Function .onInit
  ;--------------------------------
  ;Intialize
  ${ConfigRead} "config\config.conf" "node " $nodeTargetVersion
  ${ConfigRead} "config\config.conf" "git " $gitTargetVersion
 
  Banner::show /set 76 "Please wait while Setup is loading..." "Checking Node JS installed..."
  Call checkNodeJSInstalled
  Banner::getWindow
	Pop $1

  GetDlgItem $2 $1 1030
	SendMessage $2 ${WM_SETTEXT} 0 "STR:Checking GIT installed..."
  Call checkGitInstalled
  
  Banner::destroy
FunctionEnd

;-------------------------------------
;Support functions

Function checkNodeJSInstalled
  ;-----------------------------
  ; Check Node JS and NPM is installed
  nsExec::ExecToStack 'node -v'
	Pop $0 # return value/error/timeout
  Pop $1 # printed text, up to ${NSIS_MAX_STRLEN}
  ${CommandErrorVersion} 'Node' $0 $1 $nodeTargetVersion
  ;-----------------------------
  ; Getting version no from text by removing v from version info
  StrCpy $1 $1 "" 1
  ${TrimNewLines} $1 $1

  ${VersionCheck} 'Node' $1 $nodeTargetVersion
FunctionEnd

Function checkGitInstalled
  ;-----------------------------
  ; Check Node JS and NPM is installed
  nsExec::ExecToStack 'git --version'
	Pop $0 # return value/error/timeout
  Pop $1 # printed text, up to ${NSIS_MAX_STRLEN}
	${StrRep} $1 $1 "git version " ""
  ${CommandErrorVersion} 'GIT' $0 $1 $gitTargetVersion
  ${VersionCheck} 'GIT' $1 $gitTargetVersion
FunctionEnd
