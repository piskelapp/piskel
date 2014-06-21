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
  set DEST_FOLDER=%RELEASES_FOLDER%\win

  ECHO "Building Piskel executable for Windows ..."

  ECHO "Creating release directory ..."
    MKDIR "%DEST_FOLDER%"
  ECHO "DONE"

  ECHO "Packaging executable ..."
    COPY /b "%APP_BIN%\nw.exe"+"%RELEASES_FOLDER%\piskel\piskel.nw" "%DEST_FOLDER%\piskel-raw.exe"
  ECHO "DONE"

  ECHO "COPYing dependencies ..."
    COPY "%APP_BIN%\*.dll" "%DEST_FOLDER%\"
    COPY "%APP_BIN%\nw.pak" "%DEST_FOLDER%\"
  ECHO "DONE"

  ECHO "Updating Piskel icon -- Using Resource Hacker"
    %RESOURCE_HACKER_PATH%\ResHacker -addoverwrite "%DEST_FOLDER%\piskel-raw.exe", "%DEST_FOLDER%\piskel-exploded.exe", "%MISC_FOLDER%\desktop\logo.ico", ICONGROUP, IDR_MAINFRAME, 1033
    DEL "%DEST_FOLDER%\piskel-raw.exe"
  ECHO "DONE"

  ECHO "Boxing application to single file -- Using Enigma Virtual Box"
    %VBOX_PATH%\enigmavbconsole "%MISC_FOLDER%\desktop\package-piskel.evb"
    DEL "%DEST_FOLDER%\*.dll"
    DEL "%DEST_FOLDER%\nw.pak"
    DEL "%DEST_FOLDER%\piskel-exploded.exe"
  ECHO "DONE"

  PAUSE
  explorer "%DEST_FOLDER%\"

ENDLOCAL