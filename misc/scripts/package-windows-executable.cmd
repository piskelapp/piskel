setlocal
@echo off

pushd ..\..
set PISKEL_HOME=%cd%
popd

echo "Building Piskel executable for Windows ..."

echo "Creating release directory ..."
mkdir "%PISKEL_HOME%\dest\desktop\releases\windows"
echo "DONE"

echo "Packaging executable ..."
copy /b "%PISKEL_HOME%\dest\desktop\cache\win\0.9.2\nw.exe"+"%PISKEL_HOME%\dest\desktop\releases\piskel\piskel.nw" "%PISKEL_HOME%\dest\desktop\releases\windows\piskel.exe"
echo "DONE"

echo "Copying dependencies ..."
copy "%PISKEL_HOME%\dest\desktop\cache\win\0.9.2\*.dll" "%PISKEL_HOME%\dest\desktop\releases\windows\"
copy "%PISKEL_HOME%\dest\desktop\cache\win\0.9.2\nw.pak" "%PISKEL_HOME%\dest\desktop\releases\windows\"
echo "DONE"


echo "Updating Piskel icon"
ResHacker -addoverwrite "%PISKEL_HOME%\dest\desktop\releases\windows\piskel.exe", "%PISKEL_HOME%\dest\desktop\releases\windows\piskel-release.exe", "%PISKEL_HOME%\misc\desktop\logo.ico", ICONGROUP, IDR_MAINFRAME, 1033
rm "%PISKEL_HOME%\dest\desktop\releases\windows\piskel.exe"
mv "%PISKEL_HOME%\dest\desktop\releases\windows\piskel-release.exe" "%PISKEL_HOME%\dest\desktop\releases\windows\piskel.exe"
echo "DONE"



pause

explorer "%PISKEL_HOME%\dest\desktop\releases\windows"

endlocal