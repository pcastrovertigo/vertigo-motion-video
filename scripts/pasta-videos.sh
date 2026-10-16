#!/usr/bin/env bash
# Imprime a pasta "Vídeos" padrão do sistema (Windows via WSL, macOS, Linux).
if [ -f /proc/version ] && grep -qi microsoft /proc/version; then
  W=$(powershell.exe -NoProfile -Command "[Environment]::GetFolderPath('MyVideos')" 2>/dev/null | tr -d '\r')
  [ -n "$W" ] && wslpath -u "$W" && exit 0
fi
case "$(uname)" in
  Darwin) echo "$HOME/Movies" ;;
  *) D=$(xdg-user-dir VIDEOS 2>/dev/null); [ -n "$D" ] && [ "$D" != "$HOME" ] && echo "$D" || echo "$HOME/Videos" ;;
esac
