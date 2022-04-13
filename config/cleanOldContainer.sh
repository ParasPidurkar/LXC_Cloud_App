while getopts n:d:a: OPT; do
    case "$OPT" in
      d)
        DOWNLOAD_LINK="$OPTARG" ;;
      n)
        NAME="$OPTARG" ;;
      a)
        ARCHITECTURE="$OPTARG" ;;
      [?])
        # got invalid option
        echo "Usage: $0 [-d download_from] [-n name] [-a architecture]" >&2
        exit 1 ;;
    esac
done

FNAME=$(echo ${DOWNLOAD_LINK##*/})

if [[ -f $FNAME ]] ; then
    rm -rf $FNAME 
fi
lxc-stop -n $NAME
rm -rf /var/lib/lxc/$NAME
mkdir -p /var/lib/lxc/$NAME/rootfs