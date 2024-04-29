from selenium import webdriver
import time
import csv
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import requests, os, random


driver = webdriver.Chrome()

tweet = 1
item  = f"#react-root > div > div > div.css-175oi2r.r-1f2l425.r-13qz1uu.r-417010.r-18u37iz > main > div > div > div > div.css-175oi2r.r-kemksi.r-1kqtdi0.r-13l2t4g.r-1ljd8xs.r-1phboty.r-16y2uox.r-184en5c.r-61z16t.r-11wrixw.r-1jgb5lz.r-13qz1uu.r-1ye8kvj > div > div:nth-child(3) > div > div > section > div > div > div:nth-child({tweet})"

a = driver.find_element(by=By.CSS_SELECTOR, value="#react-root > div > div > div.css-175oi2r.r-1f2l425.r-13qz1uu.r-417010.r-18u37iz > main > div > div > div > div.css-175oi2r.r-kemksi.r-1kqtdi0.r-13l2t4g.r-1ljd8xs.r-1phboty.r-16y2uox.r-184en5c.r-61z16t.r-11wrixw.r-1jgb5lz.r-13qz1uu.r-1ye8kvj > div > div:nth-child(3) > div > div > section > div > div > div:nth-child(4)")


text = a.text
a.find_element(by=By.TAG_NAME, value="span")
text = a.text
text = text.split('\n').join(" ")
images = []

b = a.find_elements(by=By.TAG_NAME, value="img")
for i in b:
    images.append(i.get_attribute('src'))
if len(images>1):
    for i in range(1,len(images)):
        img_data = requests.get(images[i]).content 
        try:
            file =  open(f'images/tweet{tweet}{random.Random()}.jpg', 'wb')
            file.write(img_data)
            file.close()
        except FileNotFoundError:
            pass

