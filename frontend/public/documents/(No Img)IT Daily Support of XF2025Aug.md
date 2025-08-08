**XF**

**2025 Aug**

1. How to install the application of Production line(https://[appprod.inteplast.com - /appProduction/XF/](https://appprod.inteplast.com/appProduction/XF/))

- Coextrusion（Do Not Install The printer of the production line）

https://[appprod.inteplast.com - /appProduction/XF/CoExtrusion/](https://appprod.inteplast.com/appProduction/XF/CoExtrusion/)

If you change the label printer, please set the same static IP:

| Area | Label printer IP |
| --- | --- |
| Coex | 172.17.30.91 |

- Spiral-Cut（Do Not Install The printer of the production line）

https://[appprod.inteplast.com - /appProduction/XF/SpiralCut/](https://appprod.inteplast.com/appProduction/XF/SpiralCut/)

If you change the label printer, please set the same static IP: 172.17.30.92

| Area | Label printer IP |
| --- | --- |
| Spiral-Cut | 172.17.30.92 |

- Stretch-Lamnation（Do Not Install The printer of the production line）

https://[appprod.inteplast.com - /appProduction/XF/StretchLamination/](https://appprod.inteplast.com/appProduction/XF/StretchLamination/)

If you change the label printer, please set the same static IP: 172.17.30.93

| Area | Label printer IP |
| --- | --- |
| Stretch-Lamnation | 172.17.30.93 |

- G-Laminator（Do Not Install The printer of the production line）

https://[appprod.inteplast.com - /appProduction/XF/GLaminator/](https://appprod.inteplast.com/appProduction/XF/GLaminator/)

If you change the label printer, please set the same static IP: 172.17.30.94

| Area | Label printer IP |
| --- | --- |
| G-Lamnation | 172.17.30.94 |

- Slitting （Do Not Install The printer of the production line）

https:// [appprod.inteplast.com - /appProduction/XF/Slitting/](https://appprod.inteplast.com/appProduction/XF/Slitting/)

If you change the label printer of HA 12&13(Large), please set the same static IP:

| Area | Label printer IP(Large) | Label printer IP(Small) |
| --- | --- | --- |
| HA 12&13 | 172.17.30.167 | 172.17.31.65 |
| HA 14 | 172.17.30.97 | 172.17.30.96 |
| HA 15 | 172.17.30.98 | 172.17.30.99 |

- Shipping

https://[appprod.inteplast.com - /appProduction/XF/Schedule/](https://appprod.inteplast.com/appProduction/XF/Schedule/)

If you change the label printer, please set the same static IP: 172.17.30.55

| Area | Label printer IP |
| --- | --- |
| Shipping area | 172.17.30.55 |

- Edge-Lamination

https://[appprod.inteplast.com - /appProduction/XF/EdgeLamination/](https://appprod.inteplast.com/appProduction/XF/EdgeLamination/)

If you change the label printer（Large）, please set the same static IP:

| Area | Label printer IP(Large) | Label printer IP(Small) |
| --- | --- | --- |
| Edge-Lamination | 172.17.30.103 | 172.17.30.102 |

- Printing

https://[appprod.inteplast.com - /appProduction/XF/Printing/](https://appprod.inteplast.com/appProduction/XF/Printing/)

If you change the label printer, please set the same static IP:

| Area | Label printer IP(Large) | Label printer IP(Small) |
| --- | --- | --- |
| Printing | 172.17.30.101 | 172.17.30.100 |

How to download the “setup.exe” file for the each application.(Steps)


Install the application steps.



Teamviewer information of the Production Line’s Mini PC:

1. IT Support For Office

I only have access to the “Software” folder on the XF’s NAS; Username: cyber

- For new computer in the XF office :

Install the AS400 and Anti-viruse

Login to XF’s NAS [\\\\172.17.25.100\\](file:///\\172.17.25.100\)

Username: cyber

Password: softwareteam

Install the Anti-Virus

\\\\172.17.25.100\\Software\\Cyber\\WPJK Anti-Virus\\cmd.bat

Run the batch file(cmd.bat)



Install the AS400 steps

[\\\\172.17.25.100\\Software\\Cyber\\AS400（New Version）](file:///\\172.17.25.100\Software\Cyber\AS400（New%20Version）)





After install the AS400, please copy the “FPCTX.hod” icon copy and paste to the user’s desktop.

[\\\\172.17.25.100\\Software\\Cyber\\AS400（New Version）\\IBM ACS Client\\Files](file:///\\172.17.25.100\Software\Cyber\AS400（New%20Version）\IBM%20ACS%20Client\Files)\\FPCTX.hod



- Plant Management for Supervisor

https://[appprod.inteplast.com - /appProduction/XF/PlantMgt/](https://appprod.inteplast.com/appProduction/XF/PlantMgt/)

The install steps, see the same with production line.

- Product line Scheduling(For Feifei Chou)

https://[appprod.inteplast.com - /appProduction/XF/Scheduling/](https://appprod.inteplast.com/appProduction/XF/Scheduling/)

The install steps, see the same with production line.

1. Install and connect the Kyocera printer for office user



<https://youtu.be/F_pz6BIsRXY>



<https://youtu.be/hCYFL-8s914>

1. Setup the email account of copy machine.(IP: 172.17.24.80)

Username: **<Service@wpjk.inteplast.com>**  
password:  **Bom07544**

1. WIFI information

WIFI of XF Office：

Router mode: AP mode

IP address: 172.17.26.128(DHCP)

URL: <http://www.routerlogin.net/>

SSID: NETGEAR94

Password: fuzzyviolin497



1. XF plant map



The yellow line is the fiber optic.

The blue line is the Ethernet cable.



1. Fixed IP of XF

172.17.24.80 copy machine in the office

172.17.25.100 NAS in the maintenance office

172.17.27.10 QC query server