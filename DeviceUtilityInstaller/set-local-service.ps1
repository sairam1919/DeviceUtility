$lsAr = New-Object System.Security.AccessControl.FileSystemAccessRule ('LOCAL SERVICE',"FullControl","ContainerInherit,ObjectInherit", "InheritOnly", "Allow")

# Provides access to application folder to Local service account
Write-Host "Providing access to application folder"
[string]$dir = Get-Location
$Acl = Get-Acl $dir
$Acl.SetAccessRule($lsAr);
Set-Acl $dir $Acl