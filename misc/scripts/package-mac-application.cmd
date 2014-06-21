setlocal
@ECHO off

pushd ..\..
set PISKEL_HOME=%cd%
popd

set APP_BIN=%PISKEL_HOME%\dest\desktop\cache\mac\0.9.2
set MISC_FOLDER=%PISKEL_HOME%\misc
set RELEASES_FOLDER=%PISKEL_HOME%\dest\desktop\releases
set DEST_FOLDER=%RELEASES_FOLDER%\mac

ECHO "Building Piskel executable for Windows ..."

ECHO "Creating release directory ..."
mkdir %DEST_FOLDER%
ECHO "DONE"

ECHO "Creating application folder ..."
mkdir "%DEST_FOLDER%\piskel.app"
ECHO "DONE"

ECHO "Unzip application ..."
mkdir "%APP_BIN%\node-webkit-unzipped"
7za x "%APP_BIN%\node-webkit-v0.9.2-osx-ia32.zip" -o"%APP_BIN%\node-webkit-unzipped"
ECHO "DONE"

pause

ECHO "Copy application ..."
xcopy "%APP_BIN%\node-webkit-unzipped\node-webkit.app" "%DEST_FOLDER%\piskel.app" /E
:: xcopy "%APP_BIN%\node-webkit.app" "%DEST_FOLDER%\piskel.app" /E
ECHO "DONE"

ECHO "Copy Info.plist ..."
set CONTENTS_FOLDER=%DEST_FOLDER%\piskel.app\Contents
copy "%MISC_FOLDER%\desktop\Info.plist" "%CONTENTS_FOLDER%\"
ECHO "DONE"

ECHO "Copy application ..."
set RESOURCES_FOLDER=%CONTENTS_FOLDER%\Resources
copy "%RELEASES_FOLDER%\piskel\piskel.nw" "%RESOURCES_FOLDER%\"
mv "%RESOURCES_FOLDER%\piskel.nw" "%RESOURCES_FOLDER%\app.nw"
ECHO "%RESOURCES_FOLDER%"
ECHO "DONE"

ECHO "Copy icon ..."
DEL "%RESOURCES_FOLDER%\nw.icns"
COPY "%MISC_FOLDER%\desktop\nw.icns" "%RESOURCES_FOLDER%\"
ECHO "DONE"

pause

explorer "%DEST_FOLDER%"

endlocal