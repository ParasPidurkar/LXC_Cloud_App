#example ./createContainer.sh -n camera -a linux32 -d http://10.221.59.59:8080/files/webos_armhf_camera_rootfs.tar.bz2 

# parse the flag options (and their arguments)
no_args="true"
while getopts n:d:a:t:m: OPT; do
    case "$OPT" in
      d)
        DOWNLOAD_LINK="$OPTARG" ;;
      n)
        NAME="$OPTARG" ;;
      a)
        ARCHITECTURE="$OPTARG" ;;
      t)
        DEVICE_TYPE="$OPTARG" ;;
      m)
        MAC="$OPTARG" ;;
      [?])
      
        # got invalid option 
        echo "Usage: $0 [-d download_from] [-n name] [-a architecture] [-t device_type] [-m mac_address]" >&2
        exit 1 ;;
    esac
    no_args="false"
done

[[ "$no_args" == "true" ]] && { echo "Usage: [-d download_from] [-n name] [-a architecture] [-t device_type]";  exit 1; }

FNAME=$(echo ${DOWNLOAD_LINK##*/})

#cp ../config/$DEVICE_TYPE/config /var/lib/lxc/$NAME
cp $FNAME /var/lib/lxc/$NAME/rootfs
cd /var/lib/lxc/$NAME/rootfs && tar -xvf $FNAME
rm $FNAME

sed -i "s/^\(lxc.arch\s*=\s*\).*\$/\1$ARCHITECTURE/" /var/lib/lxc/$NAME/config
sed -i "s/^\(lxc.rootfs.path\s*=\s*\).*\$/\1dir:\/var\/lib\/lxc\/$NAME\/rootfs/" /var/lib/lxc/$NAME/config
sed -i "s/^\(lxc.uts.name\s*=\s*\).*\$/\1$NAME/" /var/lib/lxc/$NAME/config
sed -i "s/^\(lxc.net.0.hwaddr\s*=\s*\).*\$/\1$MAC/" /var/lib/lxc/$NAME/config


echo "Image created"