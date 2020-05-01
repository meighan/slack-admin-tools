# Skip if local archive is provided
if [ "$SP_SKIP_DOWNLOAD" = "TRUE" ];
  then
    echo "Skipping archive download, using local archive.zip."
# Else fetch the stuff
else
  if [ -z ${SP_DOMAIN:?} ];
    then
      echo "SP_DOMAIN needs to set";
      exit 1
  fi
  if [ -z ${SP_EMAIL:?} ];
    then
      echo "SP_EMAIL needs to set";
      exit 1
  fi
  if [ -z ${SP_PASS:?} ];
    then
      echo "SP_PASS needs to set";
      exit 1
  fi
  npm run fetch
fi

mkdir archive
unzip -qq archive.zip -d archive/
