Connect-PnPOnline -Url "https://8vbkqy.sharepoint.com/sites/ignitenursing" -Interactive

Get-pnpsitetemplate -Out "Lists.xml" -Handlers Lists -ListsToExtract @("MegaMenu","MyLinks","MegaMenuParameters")