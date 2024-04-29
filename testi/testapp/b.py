from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.keys import Keys
import time
import requests
import os
from selenium.common.exceptions import NoSuchElementException, TimeoutException

import random

# Setup WebDriver
service = ChromeService(executable_path=ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
url = "https://twitter.com/coindesk"

driver.get(url)

# Function to scroll to the bottom of the page
def load_more_tweets(driver):
    try:
        # Scroll to the bottom to load more tweets
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        # Wait for the tweets to load
        time.sleep(2)
    except:
        pass

# Collect tweets
tweets = []
try:
    last_height = driver.execute_script("return document.body.scrollHeight")
    while True:
        load_more_tweets(driver)
        new_height = driver.execute_script("return document.body.scrollHeight")
        time.sleep(5)
        if new_height == last_height:
            time.sleep(50)
            break
        last_height = new_height
except TimeoutException:
    print("Timed out waiting for page to load")

# Find tweet elements by their structure
tweet_elements = driver.find_elements(By.CSS_SELECTOR, "article[data-testid='tweet']")
print(f"Total tweets collected: {len(tweet_elements)}")

# Create a directory for images
if not os.path.exists('images'):
    os.mkdir('images')

# Process each tweet
for index, tweet in enumerate(tweet_elements):
    # Extract text content from each tweet
    text = (' '.join([e.text for e in tweet.find_elements(By.CSS_SELECTOR, "div[lang]")])).strip()
    tweets.append(text)
    print(f"Tweet {index + 1}: {text}")

    # Find and save images, skipping the first image (profile pic)
    images = [img.get_attribute('src') for img in tweet.find_elements(By.TAG_NAME, 'img')[1:]]
    for img_index, img_src in enumerate(images):
        img_data = requests.get(img_src).content
        with open(f'images/tweet_{index + 1}_image_{img_index + 1}.jpg', 'wb') as file:
            file.write(img_data)
            print(f"Saved tweet {index + 1} image {img_index + 1}")

# Close the driver
driver.quit()
