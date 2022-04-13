# Copyright (c) 2020 LG Electronics, Inc.

SUMMARY = "A minimal container image"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COREBASE}/meta/COPYING.MIT;md5=3da9cfbcb788c80a0384361b4de20420"

IMAGE_FSTYPES = "container"

inherit image

WEBOS_IMAGE_BASE_INSTALL_remove = "${FEATURE_PACKAGES_webos-extended}"

IMAGE_FEATURES = ""
IMAGE_LINGUAS = " en-us"
NO_RECOMMENDATIONS = "1"
FORCE_RO_REMOVE = "1"
MACHINE_ESSENTIAL_EXTRA_RDEPENDS = ""
PREFERRED_PROVIDER_virtual/kernel = "linux-dummy"
IMAGE_INSTALL = " <image-install> "

# Workaround /var/volatile for now
ROOTFS_POSTPROCESS_COMMAND += "rootfs_fixup_var_volatile ; "

rootfs_fixup_var_volatile () {
	install -m 1777 -d ${IMAGE_ROOTFS}/${localstatedir}/volatile/tmp
	install -m 755 -d ${IMAGE_ROOTFS}/${localstatedir}/volatile/log
}