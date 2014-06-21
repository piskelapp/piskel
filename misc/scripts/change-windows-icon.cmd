setlocal
@echo off

pushd ..\..
set PISKEL_HOME=%cd%
popd

echo "Updating Piskel icon"

ResHacker -addoverwrite "%PISKEL_HOME%\dest\desktop\releases\windows\piskel.exe", "%PISKEL_HOME%\dest\desktop\releases\windows\piskel-release.exe", "%PISKEL_HOME%\src\logo.ico", ICONGROUP, IDR_MAINFRAME, 1033

pause

explorer "%PISKEL_HOME%\dest\desktop\releases\windows"

endlocal