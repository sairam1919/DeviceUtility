# Removes access to application restricted folder to all users including admins excludes Local Service. 
# Access can only be recovered by resetting permissions to folder using
# command 'ICACLS "C:\Program Files (x86)\DeviceUtility\restricted" /T /Q /C /RESET'.
# Local Service account is used by Device Utility service to start application to access restricted folder.
[string]$dir = Get-Location
$dir = $dir + "/restricted"
$acl = Get-Acl $dir

# This removes inheritance
$acl.SetAccessRuleProtection($true,$true)
$acl |Set-Acl

$acl = Get-Item $dir |get-acl
# This removes the access for the builtin user group from the Personal folder
$acl.Access | where {$_.IdentityReference.Value.ToLower() -notmatch 'local service' -And $_.IdentityReference.Value.ToLower() -notmatch 'application package authority'} | %{$acl.RemoveAccessRule($_)}
Set-Acl $dir $acl
