Connect-PnPOnline -Url "https://handfcarecom.sharepoint.com/sites/ignitecustomsapp" -Interactive

Invoke-PnPSiteTemplate -Path "Lists.xml"