@ECHO off

SETLOCAL

  PUSHD ..\..
  set PISKEL_HOME=%cd%
  POPD

  set VBOX_PATH="C:\Program Files (x86)\Enigma Virtual Box"
  set RESOURCE_HACKER_PATH="C:\Program Files (x86)\Resource Hacker"

  set APP_BIN="%PISKEL_HOME%\dest\desktop\cache\win\0.9.2"
  set MISC_FOLDER=%PISKEL_HOME%\misc
  set RELEASES_FOLDER=%PISKEL_HOME%\dest\desktop\releases
  set DEST_FOLDER=%RELEASES_FOLDER%\piskel\win\piskel


  ECHO "Updating Piskel icon -- Using Resource Hacker"
    %RESOURCE_HACKER_PATH%\ResHacker -addoverwrite "%DEST_FOLDER%\piskel.exe", "%DEST_FOLDER%\piskel-logo.exe", "%MISC_FOLDER%\desktop\logo.ico", ICONGROUP, IDR_MAINFRAME, 1033
    DEL "%DEST_FOLDER%\piskel.exe"
  ECHO "DONE"


  PAUSE
  explorer "%DEST_FOLDER%\"

ENDLOCAL