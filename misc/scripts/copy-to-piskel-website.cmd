@ECHO off

SETLOCAL

  SET PISKEL_PATH="C:\Development\git\piskel"
  SET PISKELAPP_PATH="C:\Development\git\piskel-website"

  ECHO "Copying files to piskelapp"
  XCOPY "%PISKEL_PATH%\dest" "%PISKELAPP_PATH%\static\editor" /e /i /h /y

  ECHO "Delete previous partial"
  DEL "%PISKELAPP_PATH%\templates\editor\main-partial.html"
  ECHO "Copy new partial"
  MOVE "%PISKELAPP_PATH%\static\editor\piskelapp-partials\main-partial.html" "%PISKELAPP_PATH%\templates\editor"
  ECHO "Delete temp partial"
  RMDIR "%PISKELAPP_PATH%\static\editor\piskelapp-partials\" /S /Q

  PAUSE
  explorer "%PISKELAPP_PATH%\"

ENDLOCAL