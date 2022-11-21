#Connect-PnPOnline -Url "https://8vbkqy.sharepoint.com/sites/ignitenursing" -Interactive
Connect-PnPOnline -Url "https://handfcarecom.sharepoint.com/sites/ignitecustomsapp" -Interactive

Get-pnpsitetemplate -Out "Lists.xml" -Handlers Lists -ListsToExtract @("MegaMenu","MyLinks","MegaMenuParameters")