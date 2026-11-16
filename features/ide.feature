Feature: The Web IDE plugin
  Once the plugin is activated, every project row carries the IDE menu, and the Plugins page lists
  the plugin with its four steps.

  @needs-project-dev
  Scenario: A project row offers the IDE menu
    Given I am on "/dev"
     Then the element ".act-menu-ide" should be displayed
      And I should see "IDE"

  # The Plugins page names each plugin; the package is on the plugin's own page (the row shows it on hover only).
  Scenario: The plugin is listed on the Plugins page, and its own page names its package
    Given I am on "/settings/plugins"
     Then I should see "Web IDE"
     When I go to "/settings/plugin/ide"
     Then I should see "@webship.co/workspace-ide"

  # The AI folders are searched by name: with every plugin on, a folder lists more than one page of items.
  Scenario: The AI Skills folder lists the skill the plugin ships
    Given I am on "/ai-skills?q=ide-open-with"
     Then I should see "ide-open-with"

  Scenario: The AI Commands folder lists the command the plugin ships
    Given I am on "/ai-commands?q=ide-links"
     Then I should see "ide-links"

  Scenario: The AI Prompts folder lists the prompt the plugin ships
    Given I am on "/ai-prompts?q=ide-web-ide-check"
     Then I should see "ide-web-ide-check"
