!define ReadFile '!insertmacro ReadFile'
!define ReadCompleteFile '!insertmacro ReadCompleteFile'


Var /Global fileData

!macro ReadFile filePath var
  FileOpen $4 "${filePath}" r
    FileRead $4 "${var}"
  FileClose $4
!macroend

!macro ReadCompleteFile filePath var
  StrCpy $fileData ""

  FileOpen $4 "${filePath}" r
  loop:
      FileRead $4 "$fileData"
      IfErrors exit
      StrCpy "${var}" "${var}$fileData"
      Goto loop
  exit:
  FileClose $4
!macroend