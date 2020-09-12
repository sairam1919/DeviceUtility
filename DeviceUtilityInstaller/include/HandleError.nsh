!define HandleError "!insertmacro HandleError"
 
!macro HandleError response message
  ${If} "${response}" == "error"
  ${OrIf} "${response}" != "0"
    MessageBox MB_OK|MB_ICONSTOP "${message}"
    Abort "${message}"
  ${EndIf}
!macroend