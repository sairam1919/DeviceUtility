# Access Rule for local service
$lsAr = New-Object System.Security.AccessControl.FileSystemAccessRule ('LOCAL SERVICE',"FullControl", "Allow")
$xmlPath = (Get-Item -Path ".\").FullName
$xmlPath = $xmlPath + "\daemon\deviceutility.xml"
# Write-Host $xmlPath
# reading folder path of node js for access provisioning
[xml]$serviceXmlDoc = Get-Content $xmlPath
$nodeExeFile = $serviceXmlDoc.service.executable
Write-Host $nodeExeFile
# Providing access to node.exe file to Local service account
$Acl = Get-Acl $nodeExeFile
$Acl.SetAccessRule($lsAr);
$Acl.SetOwner((new-object System.Security.Principal.NTAccount("builtin\Administrators")))
Set-Acl $nodeExeFile $Acl
