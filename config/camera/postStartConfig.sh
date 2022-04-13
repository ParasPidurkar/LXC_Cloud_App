echo ".........................this is camera  pre start config...................."
# /home/root/socat-armel-static TCP-LISTEN:12000,fork TCP:10.0.3.2:12000 &
# /home/root/socat-armel-static TCP-LISTEN:11000,fork TCP:10.0.3.2:11000 &
# /home/root/socat-armel-static TCP-LISTEN:10000,fork TCP:10.0.3.2:10000 &




/home/root/socat-armel-static TCP-LISTEN:12000,fork TCP:10.162.42.5:12000 &
/home/root/socat-armel-static TCP-LISTEN:11000,fork TCP:10.162.42.5:11000 &
/home/root/socat-armel-static TCP-LISTEN:10000,fork TCP:10.162.42.5:10000 &